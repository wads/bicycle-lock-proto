'use strict';

import ValueCollectable from 'value_collectable';

const DEFAULT_BUFFER_SIZE = 100;
const DEFAULT_INTERVAL_MSEC = 100;

// exception functions
class IllegalInterfaceException extends Error {
}

export default class ValueCollector extends EventEmitter {
    // moudle should have 'readValue' method
    constructor(module, opt) {
        if(!(module instanceof ValueCollectable)) {
            const message = `Illegal module interface (${module})`;
            throw new IllegalInterfaceException(message);
        }
        this.module = module;
        this.buffer = [];

        if(opt['buffer_size']) {
            this.buffer_size = opt['buffer_size'];
        } else {
            this.buffer_size = DEFAULT_BUFFER_SIZE;
        }

        if(opt['interval_msec']) {
            this.interval_msec = opt['interval_msec'];
        } else {
            this.interval_msec = DEFAULT_INTERVAL_MSEC;
        }
    }

    start() {
        if(this.interval_id) {
            return;
        }

        this.interval_id = setInterval(() => {
            if(this.buffer.length >= this.buffer_size) {
                this.buffer.pop();
            }
            this.buffer.unshift(this.module.readValue());
        }, DEFAULT_INTERVAL_MSEC);

        this.emit('start');
        console.log('event start');
    }

    restart() {
        this.stop();
        this.start();
    }

    clear() {
        this.buffer = [];
    }

    pause() {
        if(this.interval_id) {
            clearInterval(this.interval_id);
            this.emit('pause');
            console.log('event pause');
        }
    }

    stop() {
        this.pause();
        this.clear();
    }

    get buffer() { return this.buffer; }
}
