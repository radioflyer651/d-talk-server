
export type PromiseFunction<T> = () => Promise<T>;
export type PromiseControls = { resolve: (x?: any) => void, reject: (err: any) => void, promise: Promise<any>; };

/** This  */
export class PromiseQueue {
    constructor() {
    }

    /** Queue of operations waiting to be processed. */
    private operationQueue = [] as PromiseFunction<any>[];

    /** Since every function added to the queue has an associated promise returned
     *   before the actual function is called, we need to associate the promise to the call
     *   so we can resolve them properly when the actual function completes. */
    private controlSets = new Map<PromiseFunction<any>, PromiseControls>();

    private currentPromise?: Promise<any>;
    // private currentPromiseControl?: PromiseControls;  // Not needed.

    protected processNextQueueItem(): void {
        // Get the next (first) item in the queue for processing.
        const nextItem = this.operationQueue.shift();

        if (nextItem) {
            // Start the call.
            const currentPromise = nextItem();
            this.currentPromise = currentPromise;

            // Get the associated controls for this.
            const currentPromiseControl = this.controlSets.get(nextItem);
            // this.currentPromiseControl = currentPromiseControl;

            // Hook up to the results of the current promise.
            currentPromise.then((x) => {
                // Let the associated promise handle resolution.  That's
                //  not our job here.
                currentPromiseControl!.resolve(x);
            }).catch(err => {
                // Let the associated promise handle the rejection.  That's
                //  not our job here.
                currentPromiseControl!.reject(err);
            }).finally(() => {
                // Trigger the next item in the queue, if we have one.
                this.processNextQueueItem();
            });

        } else {
            // Clear the properties associated with the current call.
            this.currentPromise = undefined;
            // this.currentPromiseControl = undefined;
        }
    }

    executeInQueue<T>(nextCall: PromiseFunction<T>): Promise<T> {
        // Create the promise to associate with this call, when it's actually called,
        //  and collect its control functions.
        let promiseResolve: (x?: any) => void;
        let promiseReject: (err: any) => void;
        const callPromise = new Promise<T>((res, rej) => {
            // This is called synchronously, so we're going to
            //  swallow upcoming errors about them not being set.
            promiseResolve = res;
            promiseReject = rej;
        });

        // Create the control structure for this.
        const controls: PromiseControls = {
            promise: callPromise,
            reject: promiseReject!,
            resolve: promiseResolve!
        };

        // Add these to the control structures.
        this.controlSets.set(nextCall, controls);

        // Add the call to the queue.
        this.operationQueue.push(nextCall);

        // Kick off the operations, of none are executing.
        if (!this.currentPromise) {
            this.processNextQueueItem();
        }

        // Return the promise associated with this call.
        return callPromise;
    }
}