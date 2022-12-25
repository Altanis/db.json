export default class Logger {
    /** Whether or not the logger should log debugs. */
    private verbose: boolean;

    constructor(verbose: boolean) {
        this.verbose = verbose;
    }

    public log(message: string): string {
        console.log("[\x1b[36mDB_INFO\x1b[0m]", message);
        return message;
    }

    public warn(message: string): string {
        console.warn("[\x1b[33mDB_WARN\x1b[0m]", message);
        return message;
    }

    public error(message: string, severe: boolean = true): string | void {
        console.error("[\x1b[31mDB_ERR\x1b[0m]", message);
        severe && process.exit(1);
        return message;
    }

    public debug(message: string): string {
        if (this.verbose) console.log("[\x1b[35mDB_DEBUG\x1b[0m]", message);
        return message;
    }
}