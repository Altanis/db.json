import fs from  'fs';

import { Options } from '../types/Interfaces';
import Logger from '../helpers/Logger';

export default class Pool {
    /** The file to read/write data from. */
    public file: string;
    /** The data of the file. */
    public data: {
        [key: string]: any;
    } = {};
    /** The options of the module. */
    public options: Options;
    /** The logger to log messages. */
    private logger: Logger;
    /** Cache of jobs to ensure database corruption does not happen. */
    private jobs: number = 0;
    /** Whether or not the pool has been modified. */
    private modified: boolean = false;

    constructor(file: string, options: Options, logger: Logger) {
        this.file = file;
        this.logger = logger;
        this.options = options;

        this.initialize();

        if (this.options.defer) setInterval(() => this.modified && this.save(), this.options.defer);
    }

    /** Validates the pool, internal function ran for every new instance of Pool. */
    private initialize() {
        if (!fs.readFileSync(this.file)) fs.writeFileSync(this.file, '{}');
        else {
            try {
                this.data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
            } catch (error) {
                this.logger.error('Database was unable to be read, likely due to invalid JSON. Please check your database file and try again. ' + error);
            }
        }

        this.logger.debug(`Initialized pool for file \x1b[35m${this.file}\x1b[0m`);
    }

    /** Saves values in the pool. */
    private save() {        
        if (this.jobs) setTimeout(() => this.save(), 1000);
        else {
            this.jobs++;
            fs.writeFile(this.file, JSON.stringify(this.data, null, this.options.indents || 0), (error) => {
                if (error) this.logger.error(`Failed to save database to file \x1b[35m${this.file}\x1b[0m. ${error}`);
                else this.jobs--;
            });
        }
    }

    /** Gets a value from the pool. */
    public get(key: string): any {
        if (key.includes('.')) {
            const keys = key.split('.');
            let data = this.data[keys[0]];
            for (const key of keys) data = data[key];
            return data;
        } else return this.data[key] || null;
    }

    /** Sets a value in the pool. */
    public set(key: string, value: any): void {
        this.data[key] = value;
        
        !this.options.defer && (this.modified = true, this.save());
    }

    /** Deletes a value from the pool. */
    public delete(key: string): void {
        delete this.data[key];

        !this.options.defer && (this.modified = true, this.save());
    }
}