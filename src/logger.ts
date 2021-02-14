import { OutputChannel, window } from "vscode";

/** Class for logging information */
export class Logger {
    private channel:OutputChannel;

    constructor() {
        this.channel = window.createOutputChannel('Lucid Workspace');
    }

    /**
     * @brief
     * get timestamp
     *
     * @description
     * get the value of timestamp
     */
    private get timestamp():string {
        const now = new Date();
        return `${now.toISOString().replace(/T/, ' ')}`;
    }
    
    /**
     * @brief
     * appendLine
     *
     * @description
     * Append the given string into the channel
     */
    public appendLine(message:string) {
        this.channel.appendLine(`[${this.timestamp}] ${message}`);
    }

    /**
     * @brief
     * error
     *
     * @description
     * Method to print error to output channel
     */
    public error(message:string) {
        this.appendLine(`ERR - ${message}`);
    }

    /**
     * @brief
     * warn
     *
     * @description
     * Method to print warning to output channel
     */
     public warn(message:string) {
        this.appendLine(`WRN - ${message}`)
    }

    /**
     * @brief
     * info
     *
     * @description
     * Method to print warning to output channel
     */
     public info(message:string) {
        this.appendLine(`INF - ${message}`)
    }
}

let loggerInstance = new Logger();

export function getLogger() {
    return loggerInstance
}
