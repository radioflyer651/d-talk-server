import { IErrorBase } from "./error-base.interface";

/** Error thrown when a service is not available. */
export class ServiceNotAvailableError implements IErrorBase {
    constructor(serviceName?: string) {
        if (serviceName) {
            this.message = `The ${serviceName} service is unavailable.`;
        } else {
            this.message = `The service is unavailable.`;
        }
    }

    readonly message: string;
}