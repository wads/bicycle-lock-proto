const ValueCollectable = require('value_collectable');

const DEFAULT_BUFFER_SIZE = 100;
const DEFAULT_INTERVAL_MSEC = 100;

// exception functions
function IllegalInterfaceException(module) {
    this.message = `Illegal module interface (${module})`;
    this.name = "InvalidChannelException";
}

class ValueCollector extends EventEmitter {
    // moudle should have 'readValue' method
    constructor(module, opt) {
        //if(!module.readValue) {
        if(!(module instanceof ValueCollectable)) {
            throw new IllegalInterfaceException(module);
        }
        this.module = module;
        this.buffer = [];

        // TODO: private化
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

        setTimeout(() => {
            this.emit('start');
        }, DEFAULT_INTERVAL_MSEC);
    }

    clear() {
        this.buffer = [];
    }

    pause() {
        if(this.interval_id) {
            clearInterval(this.interval_id);
            this.emit('pause');
        }
    }

    stop() {
        this.pause();
        this.clear();
    }

    get buffer() { return this.buffer; }
}

module.exports = ValueCollector;
