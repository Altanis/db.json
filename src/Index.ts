import fs from 'fs';
import { resolve, sep } from 'path';

import { Options } from './types/Interfaces';

export default class JSONWrapper {
    /** The options of the JSONWrapper. */
    public options: Options;

    constructor(options: Options) {
        this.options = options;
    }

    initialize() {
        const directory = resolve(process.cwd(), 'database');
        
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
            // this.pool = fs.writeFileSync(`${directory}${sep}${this.options.file}.json`, '{}');
        } else {
            if (!fs.existsSync(`${directory}${sep}${this.options.file}.json`)) {}
               // this.pool = fs.writeFileSync(`${directory}${sep}${this.options.file}.json`, '{}');
        }
    }
}