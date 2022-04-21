// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ILogger from './ILogger';

export default class ConsoleLogger implements ILogger {

    public constructor(private console: Console) {
    }

    public log(message: string): void {
        this.console.log(message);
    }

    public warn(message: string): void {
        this.console.warn(message);
    }

    public error(message: string): void {
        this.console.error(message);
    }
}
