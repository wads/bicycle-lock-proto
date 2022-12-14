"use strict";

const Gpio = require('onoff').Gpio;
const bleno = require('bleno');
const util = require('util');

const movement = require('./controller/movement_controller');

//const Mcp3204 = require('./adc/mcp3204'); // ADC
//const Spg27_1101 = require('./stepper_motor/spg27_1101'); // stepper motor
//const Tpr105f = require('./photoreflector/tpr_105f'); // Photoreflector

//const ValueCollector = require('./collector/value_collector');

//const GPIO_14 = 14;
//const GPIO_15 = 15;
//const GPIO_17 = 17;
//const GPIO_18 = 18;
//
//const stepper = new Spg27_1101(new Gpio(GPIO_14, 'out'),
//                               new Gpio(GPIO_15, 'out'),
//                               new Gpio(GPIO_17, 'out'),
//                               new Gpio(GPIO_18, 'out'));

//
// photoreflector
//
/*
const spi = require('spi-device');
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

const mcp3204 = spi.open(0, 0, function (err) {
    if (err) throw err;
    startCollectValue([0, 1]);
});
*/
//const adc = new Mcp3204().open();
//
//const photoreflector_r = new Tpr105f(); // Right side photoreflector
//const photoreflector_l = new Tpr105f(); // Left side photoreflector
//
//adc.bindModule(Mcp3204.CH1, photoreflector_r);
//adc.bindModule(Mcp3204.CH2, photoreflector_l);
//
//const photoreflector_r_collector = new ValueCollector(photoreflector_r);
//const photoreflector_l_collector = new ValueCollector(photoreflector_l);

//
// corrector
//
//const COLLECTOR_BUFFER_SIZE = 100;
//const CHANNEL_SIZE = 4;
//const COLLECT_INTERVAL_MSEC = 100;
//const collector_buffer = new Array(CHANNEL_SIZE);
//const interval_ids = new Array(CHANNEL_SIZE);
/*
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

const stopCollectValue = function(channels) {
    if(!Array.isArray(channels)) {
        channels = [channels];
    }

    for(let ch of channels) {
        resetCollectValue(ch);
    }
};

const resetCollectValue = function(ch) {
    if(interval_ids[ch]) {
        clearInterval(interval_ids[ch]);
        interval_ids[ch] = void 0;
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
*/

//const readyToRead = function() {
//    return collector_buffer[0].length < 30 || collector_buffer[1].length < 30;
//};

//const getSamples = function() {
//    // TODO sample?????????null???undefined??????????????????????????????
//    return [collector_buffer[0].slice(0, 10), collector_buffer[1].slice(0, 10)];
//};
//
//const avg_values = function(samples) {
//    // TODO ?????????????????????
//    if(samples.length == 0) {
//        samples = getSamples();
//    }
//
//    const sum_values = samples.map((values, idx, arr) => {
//        return values.reduce((prev, current, i, arr) => {
//            return prev + current;
//        });
//    });
//
//    return sum_values.map((value, idx, arr) => value/sum_values[idx].length);
//};
//
//const range_values = function(samples) {
//    // TODO ?????????????????????
//    if(samples.length == 0) {
//        samples = getSamples();
//    }
//
//    return samples.map((values, idx, arr) => {
//        let range = Math.max.apply(null, values) - Math.min.apply(null, values);
//        if(!range) {
//            range = 10; // TODO: default value
//        }
//        return range;
//    });
//};
//
//
// lock movement controller
//
//const fs = require('fs');
//const conf_file = './conf.json';
//const STEP_DELAY = 10;
//const MAX_FORWARD_POSITION = 30;
//const FORWARD_INTERVAL = 50; // msec
//
//let conf = {};
//const readConfFile = function() {
//    fs.readFile(conf_file, 'utf8', (err, text) => {
//        if(!text) {
//            text = '{}';
//        }
//
//        try {
//            conf = JSON.parse(text);
//            console.log(conf);
//        } catch(e) {
//            conf = {};
//        }
//    });
//};
//readConfFile();
//
//const writeConfFile = function() {
//    fs.writeFile(conf_file, JSON.stringify(conf), (err) => {
//        if(err){
//            console.log("Faild write conf: "+ err);
//        }
//    });
//};
//
//const getPosition = function() {
//    // TODO
//    // ???????????????setDefaultPosition()????????????????????????????????????
//    if(isNaN(conf['position'])) {
//        conf['position'] = 0;
//    }
//    return conf['position'];
//};
//
//const setPosition = function(pos) {
//    if(Number.isInteger(pos)) {
//        conf['position'] = pos;
//        writeConfFile();
//    }
//};
//
//const setDefaultPosition = function() {
//    setPosition(0);
//};
//
//const forwardStepMotor = function(steps) {
//    steps = parseInt(steps);
//    if(Number.isInteger(steps)) {
//        stepper.forwardStep(steps, STEP_DELAY);
//        setPosition(getPosition() - steps);
//    }
//    console.log('current pos: ' + getPosition());
//};
//
//const backwardStepMotor = function(steps) {
//    steps = parseInt(steps);
//    if(Number.isInteger(steps)) {
//        stepper.backwardStep(steps, STEP_DELAY);
//        setPosition(getPosition() + steps);
//    }
//    console.log('current pos: ' + getPosition());
//};
//
//const openLock = function() {
//    const current_position = getPosition();
//    if(current_position <= 0) {
//        console.log('openLock: Now lock is open');
//    }
//    forwardStepMotor(getPosition());
//};
//
//const closeLock = function() {
//    //if(readyToRead()) {
//    if(readyToMove()) {
//        setTimeout(closeLock, 1000);
//        return;
//    }
//
//    const samples = getSamples();
//    const avgs = avg_values(samples);
//    const ranges = range_values(samples);
//    const threshold = avgs[0] - (ranges[0] * 5);
//    let fd;
//
//    const monitor = function(threshold, retry_cnt) {
//        console.log('monitor, current=' + collector_buffer[0][0] + ' count=' + retry_cnt);
//        if(retry_cnt == 0) {
//            fd = setInterval(backwardStepMotor, FORWARD_INTERVAL, 1, 10);
//        }
//        if(getPosition() >= MAX_FORWARD_POSITION) {
//            console.log('closeLock: max forward position.');
//            clearTimeout(fd);
//            return;
//        }
//
//        if(retry_cnt >= 100) {
//            console.log('closeLock: timeout.');
//            clearTimeout(fd);
//            return;
//        }
//
//        if(collector_buffer[0][0] <= threshold) {
//            clearTimeout(fd);
//        }
//        setTimeout(monitor, FORWARD_INTERVAL, threshold, ++retry_cnt);
//    };
//    setTimeout(monitor, FORWARD_INTERVAL, threshold, 0);
//};

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

    // TODO
    // ??????????????????default position???????????????central?????????
    // 1. getPosition()???undefined?????????
    // 2. getPosition()???????????????????????????????????????
    //

    const instruction = data.toString('utf8').split(':');
    const operation = instruction[0];
    const value = instruction[1];

    //stepper.reset();
    movement.resetStepMotor();

    switch(operation) {
    case 'l': // move left
        console.log('move left');
        movement.backwardStepMotor(value);
        break;
    case 'r': // move right
        console.log('move right');
        movement.forwardStepMotor(value);
        break;
    case 'd': // set default position
        console.log('set default position');
        movement.setDefaultPosition();
        break;
    case 'o': // open lock. same as move default
        console.log('open lock');
        movement.openLock();
        break;
    case 'c': // close lock
        console.log('close lock');
        //resetCollectValue();
        movement.closeLock();
        break;
    default:
        console.log('unknown operation');
        // TODO callback??????????????????
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
    movement.reset();
});
