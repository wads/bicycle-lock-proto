'use strict';

import Spg27_1101 from '../modules/stepper_motor/spg27_1101'; // stepper motor
import PositionSensors from '../services/position_sensors';
import {PositionService, PositionServiceStorageFile} from '../services/position_service';

const GPIO_14 = 14;
const GPIO_15 = 15;
const GPIO_17 = 17;
const GPIO_18 = 18;

const stepper = new Spg27_1101(new Gpio(GPIO_14, 'out'),
                               new Gpio(GPIO_15, 'out'),
                               new Gpio(GPIO_17, 'out'),
                               new Gpio(GPIO_18, 'out'));

const MAX_FORWARD_POSITION = 30;
const FORWARD_INTERVAL = 50; // msec

export default class MovementController extends EventEmitter {
    constructor() {
        this.position_sensors = new PositionSensors();
        this.position_service = new PositionService(
            new PositionServiceStorageFile()
        );
        this.stepper = new Spg27_1101();
        this.timer_ids = {};
    }

    reset() {
        this.stepper.unbind_gpio();
    }

    get position() {
        const pos = this.position_service.position;
        if(!pos) {
            return 0;
        }
        return pos;
    }

    set position(pos) {
        this.position_service.position(pos);
    }

    setDefaultPosition() {
        this.position = 0;
    }

    openLock() {
        if(this.position <= 0) {
            console.log('openLock: Now lock is open');
        }
        this._forwardStepMotor(this.position());
    }

    closeLock() {
        if(!this.position_sensors.ready()) {
            setTimeout(this.closeLock, 1000);
            return;
        }

        const sensor_name = PositionSensors.LEFT_SENSOR;
        const threshold = this._getThreshold(sensor_name);

        //this._setTimerId(
        //    TIMER_KEY,
        //    setInterval(this.backwardStepMotor, FORWARD_INTERVAL, 1, 10)
        //);

        setTimeout(
            this._monitorLockPosition,
            FORWARD_INTERVAL,
            sensor_name,
            threshold,
            100
        );
    }

    resetStepMotor() {
        this.stepper.reset();
    }

    forwardStepMotor(steps) {
        steps = parseInt(steps);
        if(Number.isInteger(steps)) {
            this.stepper.forwardStep(steps);
            this.position = this.position - steps;
        }
    }

    backwardStepMotor(steps) {
        steps = parseInt(steps);
        if(Number.isInteger(steps)) {
            this.stepper.backwardStep(steps);
            this.position = this.position + steps;
        }
    }

    _getThreshold(sensor_name) {
        const samples = this.position_sensors.samples(sensor_name, 10);
        return samples.median()- (samples.max_diff() * 5);
    }

    _monitorLockPosition(sensor_name, threshold, retry_cnt) {
        this.backwardStepMotor(1);
        const sensor_value = this.position_sensors.samples(sensor_name, 1);

        console.log('monitor, current=' + sensor_value + ' count=' + retry_cnt);

        if(this._movementShouldFinish(sensor_value, threshold, retry_cnt)) {

        } else {
            // continue monitoring
            setTimeout(
                this._monitorLockPosition,
                FORWARD_INTERVAL,
                sensor_name,
                threshold,
                --retry_cnt
            );
        }
    }

    _movementShouldFinish(sensor_value, threshold, retry_cnt) {
        if(retry_cnt <= 0) {
            console.log('closeLock: timeout.');
            return true;
        }

        if(this.position >= MAX_FORWARD_POSITION) {
            console.log('closeLock: max forward position.');
            return true;
        }

        return sensor_value <= threshold;
    }
}
