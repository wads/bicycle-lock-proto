"use strict";

const Gpio = require('onoff').Gpio;
const bleno = require('bleno');
const util = require('util');
const spi = require('spi-device');

//
// photoreflector
//
const value_buffer = [];
const MAX_VALUE_BUFFER_SIZE = 100;

const in_data = [
    new Buffer([0x06, 0x00, 0x00]), // ch1
    new Buffer([0x06, 0x40, 0x00]), // ch2
    new Buffer([0x06, 0x80, 0x00]), // ch3
    new Buffer([0x06, 0xc0, 0x00])  // ch4
];

const message_data = function(ch) {
    return {
        sendBuffer: in_data[ch],
        receiveBuffer: new Buffer(3),
        byteLength: 3,
        speedHz: 10000
    };
};

const readValue = function(ch) {
    mcp3204.transfer([message_data(ch)], function (err, msg) {
        if (err) throw err;
        let rawValue = ((msg[0].receiveBuffer[1] & 0x0f) << 8) +
                           msg[0].receiveBuffer[2];

        if(value_buffer.length >= MAX_VALUE_BUFFER_SIZE) {
            value_buffer.pop();
        }
        value_buffer.unshift(rawValue);
    });
};

const mcp3204 = spi.open(0, 0, function (err) {
    if (err) throw err;
    setInterval(readValue, 100, 0);
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
// operation
//
const setDefaultPosition = function() {
    if(value_buffer.length < 30) {
        setTimeout(setDefaultPosition, 3000);
        return;
    }
    // TODO sampleの中にnullやundefinedが入っていた時の対応
    const sample = value_buffer.slice(0, 30);
    const value_avg = sample.reduce(function(prev, current, i, arr) {
        return prev + current;
    }) / sample.length;
    let value_range = Math.max.apply(null, sample) - Math.min.apply(null, sample);
    if(!value_range) {
        value_range = 10; // TODO: default value
    }

    console.log('avg: ' + value_avg);
    console.log('range: ' + value_range);

    const interval = 50; // msec
    const fd = setInterval(forwardStepMotor, interval, 1, 10);
    const monitor = function(retry_cnt) {
        console.log('monitor, current=' + value_buffer[0] + ' count=' + retry_cnt);
        const threshold = value_avg - (value_range * 5);
        if(value_buffer[0] <= threshold) {
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
        forwardStepMotor(value, 10);
        break;
    case 'r':
        backwardStepMotor(value, 10);
        break;
    case 'd':
        // 動かした直後はvalue_bufferの値が安定していないので少し待つ
        setTimeout(setDefaultPosition, 3000);
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
