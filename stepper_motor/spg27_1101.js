"use strict";

// rotate clockwise
const forward_seq = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];

class Spg27_1101 {
    /**
     * constructor
     *
     * @param { Gpio } gpio1: Gpio connected to connector 6 (white code)
     * @param { Gpio } gpio2: Gpio connected to connector 2 (yellow code)
     * @param { Gpio } gpio3: Gpio connected to connector 5 (red code)
     * @param { Gpio } gpio4: Gpio connected to connector 1 (green code)
     */
    constructor(gpio1, gpio2, gpio3, gpio4) {
        this.bind_gpio(gpio1, gpio2, gpio3, gpio4);
    }

    bind_gpio(gpio1, gpio2, gpio3, gpio4) {
        this.connector6 = gpio1;
        this.connector2 = gpio2;
        this.connector5 = gpio3;
        this.connector1 = gpio4;
        this.reset();
    }

    unbind_gpio() {
        this.connector6.unexport();
        this.connector2.unexport();
        this.connector5.unexport();
        this.connector1.unexport();
    }

    forwardStep(steps, delay) {
        const total_steps = steps * forward_seq.length;
        this.step(total_steps, forward_seq, delay);
    }

    backwardStep(steps, delay) {
        const total_steps = steps * forward_seq.length;
        this.step(total_steps, forward_seq.slice().reverse(), delay);
    }

    step(steps, sequence, delay) {
        for(let i = 0; i < steps; i++) {
            const self = this;
            setTimeout(function(values) {
                self.setValue(values);
            }, delay * i, sequence[i % sequence.length]);
        }
    }

    reset() {
        this.setValue([0, 0, 0, 0]);
    }

    setValue(values) {
        this.connector6.writeSync(values[0]);
        this.connector2.writeSync(values[1]);
        this.connector5.writeSync(values[2]);
        this.connector1.writeSync(values[3]);
    }
}

module.exports = Spg27_1101;
