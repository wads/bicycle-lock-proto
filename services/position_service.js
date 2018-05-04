'use strict';

const fs = require('fs');

class WriteFailedException extends Error {
}

class PositionServiceStorageInterface {
    set(pos) {
        throw new Error('Not Implemented');
    }

    get() {
        throw new Error('Not Implemented');
    }

    save() {
        throw new Error('Not Implemented');
    }
}

const POSITION_KEY = 'position';

export class PositionServiceStorageFile extends PositionServiceStorageInterface {
    constructor(path) {
        if(!path) {
            path = './conf.json';
        }
        this.file_path = path;
        this.value_changed = false;

        fs.readFile(this.file_path, 'utf8', (err, text) => {
            if(!text) {
                text = '{}';
            }

            try {
                this.storage = JSON.parse(text);
            } catch(e) {
                this.storage = {};
            }
        });
    }

    set(pos) {
        this.storage[POSITION_KEY] = pos;
        this.value_changed = true;
    }

    get() {
        return this.storage[POSITION_KEY];
    }

    save() {
        if(!this.value_changed) {
            return;
        }

        fs.writeFile(this.file_path, JSON.stringify(this.storage), (err) => {
            if(err){
                console.log('Write faild');
                throw new WriteFailedException();
            }
            this.value_changed = false;
        });
    }
}


export default class PositionService {
    constructor(storage) {
        if(!(storage instanceof PositionServiceStorageInterface)) {
            throw new Error('Invalid PositionServiceStrage class');
        }
        this.storage = storage;
    }

    get position() {
        if(isNaN(conf['position'])) {
            console.log('Position is not saved');
            return null;
        }
        return this.storage.get();
    }

    set position(pos) {
        if(Number.isInteger(pos)) {
            this.storage.set(pos);
            this.storage.save();
        } else {
            console.log('Invalid position set');
        }
    }
}
