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
    /** Whether or not the pool is locked. */
    private locked: boolean = false;

    constructor(file: string, options: Options, logger: Logger) {
        this.file = file;
        this.logger = logger;
        this.options = options;

        this.initialize();
    }

    /** Validates the pool, internal function ran for every new instance of Pool. */
    private initialize(): void {
        if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, '{}');
        else {
            try {
                this.data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
                if (this.options.defer) setInterval(() => this.modified && this.save(), this.options.defer);
            } catch (error) {
                this.logger.error('Database was unable to be read, likely due to invalid JSON. Please check your database file and try again. ' + error);
            }
        }

        this.logger.debug(`Initialized pool for file \x1b[35m${this.file}\x1b[0m`);
    }

    /** Saves values in the pool. Resolves the Job ID. */
    private async save(): Promise<number> {  
        return new Promise((res, rej) => {      
            if (this.locked) {
                this.options.defer = 0;
                return rej(this.logger.warn("Pool is locked, cannot run Pool.save(). Shutting down save deference."));
            }

            if (this.jobs) setTimeout(() => this.save(), 1000);
            else {
                this.jobs++;
                fs.writeFile(this.file, JSON.stringify(this.data, null, this.options.indents || 0), (error) => {
                    if (error) {
                        rej(this.logger.error(`Failed to save database to file \x1b[35m${this.file}\x1b[0m, will save next time. ${error}`, false));
                    } else {
                        res(this.jobs--);
                    }
                });

                if (!this.jobs) this.modified = false;
            }
        });
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
        const keys = path.split('.').filter(key => key);
        let value = this.data[key];
        
        for (const key of keys) {
            if (value?.[key]) value = value?.[key];
            else if (value?.[+key]) value = value?.[+key];
            else {
                break;
            };
        }

        return value || null;
    }

    /** Finds a value in the pool using a callback.
     * @param callback The callback to run.
     * @param all Whether or not to return all entries that match the callback.
     */
    public find(callback: (entry: object) => boolean, all: boolean = true): any {
        const entries = [];
        for (const key in this.data) {
            if (callback(this.data[key])) entries.push(this.data[key]);
        }

        return all ? entries : entries[0];
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
    public async set(key: string, value: any, path: string = ""): Promise<number | void> {
        return new Promise((res, rej) => {
            if (this.locked) return rej(this.logger.warn("Pool is locked, cannot run Pool.set()."));

            const keys = [key, ...path.split('.')].filter(key => key);
            let p = this.data;

            for (const key of keys) {
                if (key === keys[keys.length - 1]) p[key] = value;
                else if (p[key]) p = p[key];
                else p = p[key] = {};
            }

            this.options.defer ? (this.modified = true, res()) : this.save().then(res);
        });
    }

    /** Iterates over the entries.
     * @param callback The callback to run.
     */
    public forEach(callback: (entry: object) => any): any[] {
        const entries = [];
        for (const key in this.data) {
            entries.push(callback(this.data[key]));
        }

        return entries;
    }

    /** Ensure a value exists to a path, and if not set it.
     * @param key The key to ensure the value to.
     * @param value The value to ensure.
     * @param path The path to ensure the value to.
     */

    public ensure(key: string, value: any, path: string = ""): Promise<number | void> {
        return new Promise((res, rej) => {
            if (this.locked) return rej(this.logger.warn("Pool is locked, cannot run Pool.ensure()."));

            const keys = [key, ...path.split('.')].filter(key => key);
            let p = this.data;
    
            for (const key of keys) {
                if (key === keys[keys.length - 1] && !p.hasOwnProperty(key)) p[key] = value;
                else if (p[key]) p = p[key];
                else p = p[key] = {};
            }

            this.options.defer ? (this.modified = true, res()) : this.save().then(res);
        });
    }

    /** Check if a key exists.
     * @param key The key to check.
     * @param path The path to check.
     * 
     */
    public has(key: string, path: string): boolean {
        const keys = path.split('.').filter(key => key);
        let value = this.data[key];
        
        for (const key of keys) {
            if (value?.hasOwnProperty(key)) value = value?.[key];
            else if (value?.hasOwnProperty(+key)) value = value?.[+key];
            else return false;
        }

        return true;
    }

    /** Deletes a value from the pool.
     * @param key The key to delete the value from.
     * @example
     * data: { a: { b: { c: 1 } } }
     * pool.delete('a'); // {}
     * // NOTE: You cannot delete a path, only the key.
     */
    public delete(key: string): Promise<number | void> {
        return new Promise((res, rej) => {
            if (this.locked) return rej(this.logger.warn("Pool is locked, cannot run Pool.delete()."));

            delete this.data[key];
            this.options.defer ? (this.modified = true, res) : this.save().then(res);
        });
    }

    /** Clears the pool. */
    public clear(): Promise<number | void> {
        return new Promise((res, rej) => {
            if (this.locked) return rej(this.logger.warn("Pool is locked, cannot run Pool.clear()."));

            this.data = {};
            this.options.defer ? (this.modified = true, res) : this.save().then(res);
        });
    }

    /** Get the keys in the pool. */
    public keys(): Array<string> {
        return Object.keys(this.data);
    }

    /** Get the values in the pool. */
    public values(): Array<any> {
        return Object.values(this.data);
    }

    /** Get the entries in the pool. */
    public entries(): Array<[string, any]> {
        return Object.entries(this.data);
    }

    /** 
     * Observe when this value mutates.
     * @param key The key to observe.
     * @param path The path to the value to observe.
     * @example
     * data: { a: { b: { c: 1 } } }
     * const observer = pool.observe('a', 'b.c');
     * observer.c = 2; // Emits 'change' event with value 2.
    */
    public observe(key: string, path: string = "", callback: (target: object, property: string, value: any) => any): ProxyHandler<object> | void {
        if (this.locked) {
            this.logger.warn("Pool is locked, cannot run Pool.observe().");
            return;
        }

        const keys = [key, ...path.split('.')].filter(key => key);
        let p = this.data;

        for (const key of keys) {
            if (!p[key]) p[key] = {};
            p = p[key];
        }

        return new Proxy(p, {
            set: (t, p, v) => {
                /** @ts-ignore */
                if (v !== t[p]) {
                    /** @ts-ignore */
                    callback(t, p, v);
                    /** @ts-ignore */
                    t[p] = v;
                }
                return true;
            }
        });
    }

    /** Locks the pool from further use, will make it only read-only. */
    public lock(): void {
        this.locked = true;
    }

    /** Unlocks the pool. */
    public unlock(): void {
        this.locked = false;
    }

    /** Exports the pool. */
    public export(): object {
        return this.data;
    }

    /** Imports the pool. */
    public import(data: object): void {
        this.data = data;
        this.options.defer ? this.modified = true : this.save();
    }
}