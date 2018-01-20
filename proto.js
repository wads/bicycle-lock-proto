"use strict";

const Gpio = require('onoff').Gpio;
const bleno = require('bleno');
const util = require('util');
const spi = require('spi-device');

//
// photoreflector
//
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


//
// stepper motor
//
const coil_A_1_pin = new Gpio(14, 'out');
const coil_A_2_pin = new Gpio(15, 'out');
const coil_B_1_pin = new Gpio(17, 'out');
const coil_B_2_pin = new Gpio(18, 'out');

// rotate clockwise
const forward_seq = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];

const step = function(steps, sequence, delay) {
    for(let i = 0; i < steps; i++) {
        setTimeout(function(write_values) {
            coil_A_1_pin.writeSync(write_values[0]);
            coil_A_2_pin.writeSync(write_values[1]);
            coil_B_1_pin.writeSync(write_values[2]);
            coil_B_2_pin.writeSync(write_values[3]);
        }, delay * i, sequence[i % sequence.length]);
    }
};

const forwardStep = function(steps, delay) {
    const total_steps = steps * forward_seq.length;
    step(total_steps, forward_seq, delay);
};

const backwardStep = function(steps, delay) {
    const total_steps = steps * forward_seq.length;
    step(total_steps, forward_seq.slice().reverse(), delay);
};

//
// corrector
//
const COLLECTOR_BUFFER_SIZE = 100;
const CHANNEL_SIZE = 4;
const COLLECT_INTERVAL_MSEC = 100;
const collector_buffer = new Array(CHANNEL_SIZE);
const interval_ids = new Array(CHANNEL_SIZE);

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
}

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

const readyToRead = function() {
    return collector_buffer[0].length < 30 || collector_buffer[1].length < 30;
}

const mcp3204 = spi.open(0, 0, function (err) {
    if (err) throw err;
    startCollectValue([0, 1]);
});

const getSamples = function() {
    // TODO sampleの中にnullやundefinedが入っていた時の対応
    return [collector_buffer[0].slice(0, 10), collector_buffer[1].slice(0, 10)];
}

const avg_values = function(samples) {
    // TODO 配列かチェック
    if(samples.length == 0) {
        samples = getSamples();
    }

    const sum_values = samples.map((values, idx, arr) => {
        return values.reduce((prev, current, i, arr) => {
            return prev + current;
        });
    });

    return sum_values.map((value, idx, arr) => value/sum_values[idx].length);
};

const range_values = function(samples) {
    // TODO 配列かチェック
    if(samples.length == 0) {
        samples = getSamples();
    }

    return samples.map((values, idx, arr) => {
        let range = Math.max.apply(null, values) - Math.min.apply(null, values);
        if(!range) {
            range = 10; // TODO: default value
        }
        return range;
    });
};

//
// lock movement controller
//
const fs = require('fs');
const conf_file = './conf.json';
const STEP_DELAY = 10;
const MAX_FORWARD_POSITION = 30;
const FORWARD_INTERVAL = 50; // msec

let conf = {};
const readConfFile = function() {
    fs.readFile(conf_file, 'utf8', (err, text) => {
        if(!text) {
            text = '{}';
        }

        try {
            conf = JSON.parse(text);
            console.log(conf);
        } catch(e) {
            conf = {};
        }
    });
};
readConfFile();

const writeConfFile = function() {
    fs.writeFile(conf_file, JSON.stringify(conf), (err) => {
        if(err){
            console.log("Faild write conf: "+ err);
        }
    });
}

const getPosition = function() {
    // TODO
    // 初期設定でsetDefaultPosition()するようにしたら削除する
    if(isNaN(conf['position'])) {
        conf['position'] = 0;
    }
    return conf['position'];
};

const setPosition = function(pos) {
    if(Number.isInteger(pos)) {
        conf['position'] = pos;
        writeConfFile();
    }
};

const setDefaultPosition = function() {
    setPosition(0);
};

const forwardStepMotor = function(steps) {
    steps = parseInt(steps);
    if(Number.isInteger(steps)) {
        forwardStep(steps, STEP_DELAY);
        setPosition(getPosition() - steps);
    }
    console.log('current pos: ' + getPosition());
};

const backwardStepMotor = function(steps) {
    steps = parseInt(steps);
    if(Number.isInteger(steps)) {
        backwardStep(steps, STEP_DELAY);
        setPosition(getPosition() + steps);
    }
    console.log('current pos: ' + getPosition());
};

const openLock = function() {
    const current_position = getPosition();
    if(current_position <= 0) {
        console.log('openLock: Now lock is open');
    }
    forwardStepMotor(getPosition());
};

const closeLock = function() {
    if(readyToRead()) {
        setTimeout(closeLock, 1000);
        return;
    }

    const samples = getSamples();
    const avgs = avg_values(samples);
    const ranges = range_values(samples);
    const threshold = avgs[0] - (ranges[0] * 5);
    let fd;

    const monitor = function(threshold, retry_cnt) {
        console.log('monitor, current=' + collector_buffer[0][0] + ' count=' + retry_cnt);
        if(retry_cnt == 0) {
            fd = setInterval(backwardStepMotor, FORWARD_INTERVAL, 1, 10);
        }
        if(getPosition() >= MAX_FORWARD_POSITION) {
            console.log('closeLock: max forward position.');
            clearTimeout(fd);
            return;
        }

        if(retry_cnt >= 100) {
            console.log('closeLock: timeout.');
            clearTimeout(fd);
            return;
        }

        if(collector_buffer[0][0] <= threshold) {
            clearTimeout(fd);
        }
        setTimeout(monitor, FORWARD_INTERVAL, threshold, ++retry_cnt);
    };
    setTimeout(monitor, FORWARD_INTERVAL, threshold, 0);
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

    // TODO
    // 以下の場合はdefault positionが必要だとcentralに返す
    // 1. getPosition()がundefinedの場合
    // 2. getPosition()の値が明らかにおかしい場合
    //

    const instruction = data.toString('utf8').split(':');
    const operation = instruction[0];
    const value = instruction[1];

    coil_A_1_pin.writeSync(0);
    coil_A_2_pin.writeSync(0);
    coil_B_1_pin.writeSync(0);
    coil_B_2_pin.writeSync(0);

    switch(operation) {
    case 'l': // move left
        console.log('move left');
        backwardStepMotor(value);
        break;
    case 'r': // move right
        console.log('move right');
        forwardStepMotor(value);
        break;
    case 'd': // set default position
        console.log('set default position');
        setDefaultPosition();
        break;
    case 'o': // open lock. same as move default
        console.log('open lock');
        openLock();
        break;
    case 'c': // close lock
        console.log('close lock');
        resetCollectValue();
        closeLock();
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
