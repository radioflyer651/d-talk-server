import { BehaviorSubject, distinctUntilChanged } from "rxjs";

export type PromiseLimiterTask<T> = () => Promise<any>;
type PromiseControls = { resolve: (x?: any) => void, reject: (err: any) => void, promise: Promise<any>; };
type LimiterStateTypes = 'not-started' | 'idle' | 'running';

export class PromiseLimiter {
    constructor(
        /** The number of promises allowed to run at a time within this queue. */
        readonly executionLimit: number = 5,
    ) { }

    /** Set of running promises. */
    protected runningPromises = [] as Promise<any>[];

    /** Set of tasks, which yield promises, which are queued to run. */
    protected taskQueue = [] as PromiseLimiterTask<any>[];

    /** A set of promise controls related to tasks.  This allows subscriptions to promises for the tasks, monitoring their completion,
     *   even though they haven't started running yet. */
    protected taskPromiseControls = new Map<PromiseLimiterTask<any>, PromiseControls>();

    protected cycleTasks() {
        // Exit if we don't need to run any new tasks.
        if (this.runningPromises.length >= this.executionLimit) {
            return;
        }

        // Update the limiter's state, based on our next steps.
        if (this.taskQueue.length < 1) {
            // No tasks to queue up!
            if (this.runningPromises.length > 0) {
                // Not idle, so no state change.
            } else {
                // We're all done running tasks, so we're idle.
                this._limiterState.next('idle');
            }

            // Nothing to do - we have no new tasks to kick off.
            return;
        }

        // We have to kick off some tasks, so move to the running state.
        this._limiterState.next('running');

        // Start a new task, and configure the promise to work with the system.
        const nextTask = this.taskQueue.shift()!;
        const newPromise = nextTask();

        // Add this to the promise list.
        this.runningPromises.push(newPromise);

        // Get the promise controls for this task's related promise.
        const promiseControls = this.taskPromiseControls.get(nextTask)!;

        // When the promise settles, we need to call the right method on the related promise, and perform cleanup.
        newPromise
            .then(result => {
                promiseControls.resolve(result);
            })
            .catch(err => {
                promiseControls.reject(err);
            })
            .finally(() => {
                // Remove this item from the tracking lists.
                this.taskPromiseControls.delete(nextTask);

                const promiseIndex = this.runningPromises.indexOf(newPromise);
                if (promiseIndex >= 0) {
                    this.runningPromises.splice(promiseIndex);
                }

                // Kick off more promises if there are any.
                this.cycleTasks();
            });
    }

    addTask<T>(task: PromiseLimiterTask<T>): Promise<T> {
        // Add the task to the queue.
        this.taskQueue.push(task);

        // Create the promise for this task, and collect the promise's control functions.
        let promiseControls: PromiseControls;
        const result = new Promise<T>((resolve, reject) => {
            promiseControls = {
                resolve,
                reject
            } as any; // We have to nab the promise when we get out, so this isn't the exact right form yet.
        });
        promiseControls!.promise = result;
        this.taskPromiseControls.set(task, promiseControls!);

        // Kick off task processing, if needed.
        this.cycleTasks();

        // Return the promise.
        return result;
    }

    protected _limiterState = new BehaviorSubject<LimiterStateTypes>('not-started');
    readonly limiterState = this._limiterState.asObservable().pipe(distinctUntilChanged());
}