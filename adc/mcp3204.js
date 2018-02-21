"use strict";

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
class Mcp3204 extends spi {
    static hoge() {
        spi.open(0, 0, function (err) {
            if (err) throw err;
            startCollectValue([0, 1]);
        });
    }

    open(cb) {
        super(BUS_NUMBER, DEVICE_NUMBER, cb);
    }

    txData(ch) {
        return {
            sendBuffer: tx_data_list[ch],
            receiveBuffer: new Buffer(3),
            byteLength: 3
        };
    }

    extractValue(msg) {
        return ((msg.receiveBuffer[1] & 0x0f) << 8) + msg.receiveBuffer[2];
    }
}

module.exports = Mcp3204;
