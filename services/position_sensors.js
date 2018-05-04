'use strict';

import Tpr105f from '../modules/photoreflector/tpr_105f'; // Photoreflector
import Mcp3204 from '../modules/adc/mcp3204'; // ADC
import ValueCollector from './services/collector/value_collector';
import DataSample from '../models/data_sample';

const COLLECTOR_STATUS_STOP = 0;
const COLLECTOR_STATUS_WORKING = 1;
const COLLECTOR_STATUS_PAUSE = 2;

const MONITOR_INTERVAL = 100;

const MIN_COLLECTOR_VALUE_LENGTH = 30;

export default class PositionSensors {
    static get LEFT_SENSOR() {
        return 'left_tpr105f';
    }

    static get RIGHT_SENSOR() {
        return 'right_tpr105f';
    }

    constructor() {
        this.photoreflector = {};
        this.adc = new Mcp3204().open();
        this.sensors = {};

        this._setupPhotoreflector(PositionSensors.LEFT_SENSOR);
        this._setupPhotoreflector(PositionSensors.RIGHT_SENSOR);
    }

    ready() {
        return this.sensors.every((current) => {
            return this._collector_status(current) == COLLECTOR_STATUS_WORKING;
        });
    }

    samples(name, len, st=0) {
        const collector = this._collector(name);
        return collector.slice(st, st + len);
    }

    reset(name) {
        this._collector(name).restart();
    }

    _collector(name) {
        return this.sensors[name]['collector'];
    }

    _collector_status(name) {
        return this.sensors[name]['collector_status'];
    }

    _setupPhotoreflector(name) {
        const photoreflector = new Tpr105f();
        this.photoreflector[name] = photoreflector;
        this.adc.bindModule(Mcp3204.CH2, photoreflector);

        const collector = new ValueCollector(photoreflector);
        collector.on('start', () => {
            console.log(name + 'collector emits start');
            this._collectorLaunchMonitor(name);
        });
        collector.on('pause', () => {
            console.log(name + 'collector emits pause');
            if(this.readyToMove()) {
                this.emit('standby');
            }
            this.sensors[name]['collector_status'] = COLLECTOR_STATUS_PAUSE;

        });
        this.sensors[name] = {
            collector: collector,
            collector_status: COLLECTOR_STATUS_STOP
        };
    }

    _collectorLaunchMonitor(name) {
        if(this._collector(name).buffer.length >= MIN_COLLECTOR_VALUE_LENGTH) {
            console.log(name + 'collector is ready');
            this._collector_status(name) = COLLECTOR_STATUS_WORKING;
            if(this.readyToMove()) {
                this.emit('ready');
            }
        } else {
            console.log(name + 'collector not ready');
            setTimeout(this._collectorLaunchMonitor, MONITOR_INTERVAL, name);
        }
    }
}
