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
                this.jobs--;
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

    /** Deletes a value from the pool.
     * @param key The key to delete the value from.
     * @example
     * data: { a: { b: { c: 1 } } }
     * pool.delete('a'); // {}
     * // NOTE: You cannot delete a path, only the key.
     */
    // TODO(Altanis): Add path support.
    public delete(key: string): void {
        delete this.data[key];
        !this.options.defer && (this.modified = true, this.save());
    }

    /** Clears the pool. */
    public clear(): void {
        this.data = {};
        !this.options.defer && (this.modified = true, this.save());
    }

    // A R R A Y  M E T H O D S

    /** Pushes an element into an array.
     * @param key The key to push the element to.
     * @param value The value to push.
     * @example
     * data: { a: [1, 2, 3] }
     * pool.push('a', 4); // { a: [1, 2, 3, 4] }
     */
    public push(key: string, value: any) {
        this.data[key] = this.data[key] ?? [];
        this.data[key].push(value);
    }

    /** Removes an element from an array.
     * @param key The key to remove the element from.
     * @param value The value to remove.
     * @example
     * data: { a: [1, 2, 3] }
     * pool.remove('a', 2); // { a: [1, 3] }
    */
    public remove(key: string, value: any) {
        this.data[key] = this.data[key] ?? [];
        this.data[key] = this.data[key].filter((v: any) => v !== value);
    }
}