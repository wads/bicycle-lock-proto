"use strict";
/*
  mcp3204 is AD converter with four input channels (ch1-4)
*/
const spi = require('spi-device');
const CHANNEL_SIZE = 4;
const BUS_NUMBER = 0;
const DEVICE_NUMBER = 0;
const tx_data_list = [
    new Buffer([0x06, 0x00, 0x00]), // ch1
    new Buffer([0x06, 0x40, 0x00]), // ch2
    new Buffer([0x06, 0x80, 0x00]), // ch3
    new Buffer([0x06, 0xc0, 0x00])  // ch4
];

// exception functions
function InvalidChannelException(ch) {
    this.message = `Invalid channel set (${ch})`;
    this.name = "InvalidChannelException";
}

function ChannelIsAlreadyBindingException(ch) {
    this.message = `Channel is already binding (${ch})`;
    this.name = "ChannelIsAlreadyBindingException";
}

class Mcp3204 extends spi {
    static CH1 = 1;
    static CH2 = 2;
    static CH3 = 3;
    static CH4 = 4;

    static txData(ch) {
        return {
            sendBuffer: tx_data_list[Mcp3204.channelIndex(ch)],
            receiveBuffer: new Buffer(3),
            byteLength: 3
        };
    }

    static extractValue(msg) {
        return ((msg.receiveBuffer[1] & 0x0f) << 8) + msg.receiveBuffer[2];
    }

    static channelIndex(ch) {
        if(ch > CHANNEL_SIZE) {
            throw new InvalidChannelException(ch);
        }
        return ch - 1;
    }

    toString() {
        return 'mcp_3204';
    }

    open(cb) {
        this.binding = new Array(CHANNEL_SIZE);
        super(BUS_NUMBER, DEVICE_NUMBER, (err) => {
            if (err) {
                throw err;
            }
        });
    };

    bindModule(ch, module) {
        if(this.isBindingModule(ch)) {
            throw new ChannelIsAlreadyBindingException(ch);
        }

        this.binding[Mcp3204.channelIndex(ch)] = module;

        // bind ValueCollectable interface
        module.attachedChannel() = () => { return ch; };
        module.readValue = () => {
            return () => {
                return this.transfer([Mcp3204.txData(ch)], (err, msg) => {
                    if (err) {
                        throw err;
                    }
                    return Mcp3204.extractValue(msg[0]);
                });
            };
        };
    }

    unbindModule(module) {
        const ch = module.attachedChannel();
        this.binding[Mcp3204.channelIndex(ch)] = undefined;

        // unbind method
        module.attachedChannel = undefined;
        module.readValue = undefined;
    }

    isBindingModule(ch) {
        return !this.binding[Mcp3204.channelIndex(ch)];
    }
}

module.exports = Mcp3204;
