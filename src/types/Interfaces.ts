/** The options provided when initializing a new JSONWrapper instance. */
export interface Options {
    /** The path to read from or write to. */
    file: string;
    /** Specify whether or not to create backups. Defaults to `false` */
    backup?: boolean;
    /** Specify whether or not to create verbose logs. Defaults to `true`. */
    verbose?: boolean;
    /** Whether or not to defer saves to file. `0` means no delay, default is `0`. */
    defer?: number;
    /** The amount of indents to use when saving to file. Defaults to `0`. */
    indents?: number;
}