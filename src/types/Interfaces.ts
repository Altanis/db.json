/** The options provided when initializing a new JSONWrapper instance. */
export interface Options {
    /** The path to read from or write to.. */
    file: string;
    /** Specify whether or not to overwrite files. Defaults to `false`. */
    overwrite?: boolean;
    /** Specify whether or not to create backups. Defaults to `false` */
    backup?: boolean;
}