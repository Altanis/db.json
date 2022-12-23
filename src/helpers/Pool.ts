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

    /** 
     * Gets a value from the pool.
     * @param key The key to get the value from. 
     * @param path The path to get the value from.
     * 
     * @example
     * data: { a: { b: { c: 1 } } }
     * pool.get('a', 'b.c'); // 1
     * pool.get('a', 'b'); // { c: 1 }
     * pool.get('a'); // { b: { c: 1 } }
    */
    public get(key: string, path: string = ""): any {
        const keys = path.split('.');
        let value = this.data[key];
        
        for (const key of keys) {
            if (value?.[key]) value = value?.[key];
            else if (value?.[+key]) value = value?.[+key];
            else {
                value = null;
                break;
            };
        }

        return value;
    }

    /** Sets a value in the pool.
     * @param key The key to set the value to.
     * @param value The value to set.
     * @param path The path to set the value to.
     * 
     * @example
     * data: { a: { b: { c: 1 } } }
     * pool.set('a', 2, 'b'); // { a: { b: 2 } }
     * pool.set('a', 2, 'b.c'); // { a: { b: { c: 2 } } }
     * pool.set('a', 2); // { a: 2 }
     * pool.set('a', 2, 'b.d'); // { a: { b: { c: 1, d: 2 } } }
     */
    public set(key: string, value: any, path: string = ""): void {
        const keys = [key, ...path.split('.')];
        let p = this.data;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!p[key]) p[key] = {};
            p = p[key];
        }

        p[keys[keys.length - 1]] = value;
        !this.options.defer && (this.modified = true, this.save());
    }

    /** Deletes a value from the pool. */
    // TODO(Altanis): Add path support.
    public delete(key: string): void {
        delete this.data[key];
        !this.options.defer && (this.modified = true, this.save());
    }
}