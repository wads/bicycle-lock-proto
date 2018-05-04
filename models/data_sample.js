'use strict';

export default class DataSample extends Array {
    range() {
        if(this.length == 0) {
            return null;
        }
        return [Math.min.apply(null, this), Math.max.apply(null, this)];
    }

    max_diff() {
        const range = this.range();
        if(range === null) {
            return null;
        }
        return range[1] - range[0];
    }

    average() {
        return this.reduce((prev, current, i, arr) => {
            return prev + current;
        }) / this.length;
    }

    median() {
        const half = (this.length / 2) | 0;
        const temp = [].concat(this).sort();

        if(temp.length % 2) {
            return temp[half];
        }
        return (temp[half-1] + temp[half]) / 2;
    }
}
