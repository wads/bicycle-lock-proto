"use strict";

const Gpio = require('onoff').Gpio;
const bleno = require('bleno');
const util = require('util');

// stepper motor
const coil_A_1_pin = new Gpio(14, 'out');
const coil_A_2_pin = new Gpio(15, 'out');
const coil_B_1_pin = new Gpio(17, 'out');
const coil_B_2_pin = new Gpio(18, 'out');

const forward_seq = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];

const stepMotor = function(steps, sequence, delay) {
    console.log('-- stepMotor --');
    let total_step = steps * sequence.length;
    for(let i = 0; i < total_step; i++) {
        setTimeout(function(write_values) {
            console.log(write_values);
            coil_A_1_pin.writeSync(write_values[0]);
            coil_A_2_pin.writeSync(write_values[1]);
            coil_B_1_pin.writeSync(write_values[2]);
            coil_B_2_pin.writeSync(write_values[3]);
        }, delay * i, sequence[i % sequence.length]);
    }
};

const forwardStepMotor = function(steps, delay) {
    console.log('-- forwardStepMotor --');
    stepMotor(steps, forward_seq, delay);
};

const backwardStepMotor = function(steps, delay) {
    console.log('-- backwardStepMotor --');
    stepMotor(steps, forward_seq.reverse(), delay);
};

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
    console.log('onWriteRequest');

    const instruction = data.toString('utf8').split(':');
    const direction = instruction[0];
    const steps = instruction[1];

    //const cmd = 'python stepper.py -d ' + direction + ' -s ' + (steps * 2);
    //console.log(cmd);
    //const execSync = require('child_process').execSync;
    //const result = execSync(cmd);

    setCurrent([0, 0, 0, 0])
    if(direction === 'l') {
        forwardStepMotor(steps * 2, 10);
    } else {
        backwardStepMotor(steps * 2, 10);
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
