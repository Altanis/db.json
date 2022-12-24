import fs from 'fs';
import { resolve, sep } from 'path';

import { Options } from './types/Interfaces';

import Pool from './helpers/Pool';
import Logger from './helpers/Logger';

export default class JSONWrapper {
    /** The options of the JSONWrapper. */
    public options: Options;
    /** The pools to read/write data from. */
    public pool: Pool | null = null;
    /** The logger to write messages to the console. */
    private logger: Logger;

    constructor(options: Options) {
        this.options = options;
        this.options.backup = this.options.backup || false;
        this.options.verbose = this.options.verbose || true;
        this.options.defer = this.options.defer || 0;

        this.logger = new Logger(this.options.verbose);

        this.initialize();
    }

    /** Initializes the database, internal function ran for every new instance of JSONWrapper. */
    private initialize() {
        const directory = resolve(process.cwd(), 'database');
        
        if (!fs.existsSync(directory)) fs.mkdirSync(directory);
        this.pool = new Pool(`${directory}${sep}${this.options.file}.json`, this.options, this.logger);
    }
}