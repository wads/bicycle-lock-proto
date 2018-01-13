"use strict";

const Gpio = require('onoff').Gpio;
const bleno = require('bleno');
const util = require('util');
const spi = require('spi-device');

//
// photoreflector
//
const COLLECTOR_BUFFER_SIZE = 100;
const CHANNEL_SIZE = 4;
const COLLECT_INTERVAL_MSEC = 100;
const collector_buffer = new Array(CHANNEL_SIZE);
const interval_ids = new Array(CHANNEL_SIZE);
const tx_data_list = [
    new Buffer([0x06, 0x00, 0x00]), // ch1
    new Buffer([0x06, 0x40, 0x00]), // ch2
    new Buffer([0x06, 0x80, 0x00]), // ch3
    new Buffer([0x06, 0xc0, 0x00])  // ch4
];

const txData = function(channel) {
    return {
        sendBuffer: tx_data_list[channel],
        receiveBuffer: new Buffer(3),
        byteLength: 3
    };
};

const extractValue = function(message) {
    return ((message.receiveBuffer[1] & 0x0f) << 8) + message.receiveBuffer[2];
};

const startCollectValue = function(channels) {
    if(!Array.isArray(channels)) {
        channels = [channels];
    }

    for(let ch of channels) {
        if(!Number.isInteger(ch) || ch < 0 || ch > CHANNEL_SIZE) continue;
        resetCollectValue(ch);
        interval_ids[ch] = setInterval(collectValue, COLLECT_INTERVAL_MSEC, ch);
    }
};

const resetCollectValue = function(ch) {
    if(interval_ids[ch]) {
        clearInterval(interval_ids[ch]);
    }
    collector_buffer[ch] = [];
};

const collectValue = function(channel) {
    mcp3204.transfer([txData(channel)], function (err, msg) {
        if (err) throw err;

        if(collector_buffer[channel].length >= COLLECTOR_BUFFER_SIZE) {
            collector_buffer[channel].pop();
        }
        collector_buffer[channel].unshift(extractValue(msg[0]));
    });
};

const readyToRead = function() {
    return collector_buffer[0].length < 30 || collector_buffer[1].length < 30;
}

const mcp3204 = spi.open(0, 0, function (err) {
    if (err) throw err;
    startCollectValue([0, 1]);
});

//
// stepper motor
//
const coil_A_1_pin = new Gpio(14, 'out');
const coil_A_2_pin = new Gpio(15, 'out');
const coil_B_1_pin = new Gpio(17, 'out');
const coil_B_2_pin = new Gpio(18, 'out');

const forward_seq = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];

const stepMotor = function(steps, sequence, delay) {
    let total_step = steps * sequence.length;
    for(let i = 0; i < total_step; i++) {
        setTimeout(function(write_values) {
            coil_A_1_pin.writeSync(write_values[0]);
            coil_A_2_pin.writeSync(write_values[1]);
            coil_B_1_pin.writeSync(write_values[2]);
            coil_B_2_pin.writeSync(write_values[3]);
        }, delay * i, sequence[i % sequence.length]);
    }
};

const forwardStepMotor = function(steps, delay) {
    stepMotor(steps, forward_seq, delay);
};

const backwardStepMotor = function(steps, delay) {
    stepMotor(steps, forward_seq.slice().reverse(), delay);
};

//
// lock movement controller
//
const setDefaultPosition = function() {
    if(readyToRead()) {
        setTimeout(setDefaultPosition, 1000);
        return;
    }
    // TODO sampleの中にnullやundefinedが入っていた時の対応
    const sample = [collector_buffer[0].slice(0, 10), collector_buffer[1].slice(0, 10)];
    const value_avg = sample.map((values, idx, arr) => {
        return values.reduce((prev, current, i, arr) => {
            return prev + current;
        });
    }).map((value, idx, arr) => value/sample[idx].length);
    let value_range = sample.map((values, idx, arr) => {
        let range = Math.max.apply(null, values) - Math.min.apply(null, values);
        if(!range) {
            range = 10; // TODO: default value
        }
        return range;
    });

    // 片側のみ対応
    const interval = 50; // msec
    const fd = setInterval(forwardStepMotor, interval, 1, 10);
    const monitor = function(retry_cnt) {
        console.log('monitor, current=' + collector_buffer[0][0] + ' count=' + retry_cnt);
        const threshold = value_avg[0] - (value_range[0] * 5);
        if(collector_buffer[0][0] <= threshold) {
            clearTimeout(fd);
        } else if(retry_cnt < 60) {
            setTimeout(monitor, interval, ++retry_cnt);
        } else {
            console.log('timeout setDefaultPosition');
            clearTimeout(fd);
        }
    };
    setTimeout(monitor, interval, 0);
};

//
// bleno
//

// Service name
// maximun 26 bytes
const name = 'lock_proto';

// Uuid
const moveServiceUuid = 'ff10';

const LockCharc = function() {
    LockCharc.super_.call(this, {
        uuid: 'ff11',
        properties: ['read', 'write']
    });
};
util.inherits(LockCharc, bleno.Characteristic);

LockCharc.prototype.onReadRequest = function(offset, callback) {
    console.log('onReadRequest');

    // sample
    const data = new Buffer(1);
    data[0] = 1;
    callback(this.RESULT_SUCCESS, data);
};

LockCharc.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    console.log('onWriteRequest: ' + data.toString('utf8'));

    const instruction = data.toString('utf8').split(':');
    const operation = instruction[0];
    const value = instruction[1];

    coil_A_1_pin.writeSync(0);
    coil_A_2_pin.writeSync(0);
    coil_B_1_pin.writeSync(0);
    coil_B_2_pin.writeSync(0);

    switch(operation) {
    case 'l':
        console.log('move left');
        forwardStepMotor(value, 10);
        break;
    case 'r':
        console.log('move right');
        backwardStepMotor(value, 10);
        break;
    case 'd':
        console.log('set default');
        // 動かした直後はcollector_bufferの値が安定していないので少し待つ
        setTimeout(setDefaultPosition, 1000);
        break;
    default:
        console.log('unknown operation');
        // TODO callbackの内容を検討
    }

    callback(this.RESULT_SUCCESS);
};

const moveService = new bleno.PrimaryService({
    uuid: moveServiceUuid,
    characteristics: [
        new LockCharc()
    ]
});

bleno.on('stateChange', function(state) {
    console.log('stateChange');
    if(state === 'poweredOn') {
        console.log('ble poower on');
        bleno.startAdvertising(name, [moveServiceUuid]);
    } else {
        console.log(state);
        bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', function(err) {
    if(!err) {
        bleno.setServices([moveService]);
    }
});

process.on('SIGINT', function () {
    coil_A_1_pin.unexport();
    coil_A_2_pin.unexport();
    coil_B_1_pin.unexport();
    coil_B_2_pin.unexport();
});
