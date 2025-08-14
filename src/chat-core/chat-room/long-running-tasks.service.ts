

/** Designed to collect long running promises, and hold them until completion. */
export class LongTaskRunner {
    constructor(
        /** An arbitrary name used for debugging and identification. */
        readonly name: string,
        /** The time, in MS, to perform maintenance on running tasks. */
        readonly maintenanceIntervalMs: number = 30000,
    ) {
        // Start maintenance cycles.
        this.startMaintenance();
    }

    /** Contains the reference to the interval timer for maintenance. */
    private _intervalRef: any;

    /** Stops the maintenance interval. */
    protected clearMaintenance() {
        if (this._intervalRef) {
            clearInterval(this._intervalRef);
            this._intervalRef = undefined;
        }
    }

    /** Starts the maintenance interval. */
    protected startMaintenance() {
        // Clear the current interval, if there is one.
        this.clearMaintenance();

        // Start a new one.
        this._intervalRef = setInterval(() => {
            this.performMaintenance();
        }, this.maintenanceIntervalMs);
    }

    /** Performs maintenance on the running tasks. */
    protected performMaintenance(): void {
        // Clear all completed tasks.
        for (let i = this.runningTasks.length - 1; i >= 0; i--) {
            // Get the task.
            const task = this.runningTasks[i];

            // Remove it if it's completed.
            if (task.isComplete) {
                this.runningTasks.splice(i, 1);
            }

            // If the task is timed out, remove it.
            if (task.shouldTimeout) {
                // Call the timeout on the task.
                task.timeout();
                // Remove it.
                this.runningTasks.splice(i, 1);
            }
        }
    }

    /** The tasks currently running, and being managed. */
    protected runningTasks: LongRunningTask[] = [];

    createNewTask(name: string, timeoutMs: number, task: Promise<any>) {
        // Create a new task, and add it to the list.
        const newTask = new LongRunningTask(name, task, timeoutMs);
        this.runningTasks.push(newTask);
    }

    /** Adds an existing long running task to be managed by this service. */
    addNewTask(task: LongRunningTask): void {
        this.runningTasks.push(task);
    }

    /** Removes a specified LongRunningTask from the running tasks list. */
    protected removeTask(task: LongRunningTask): void {
        // Get the index.
        const taskIndex = this.runningTasks.indexOf(task);

        // If not found, this could kinda be a problem... not one we need to stop on though.
        if (taskIndex < 0) {
            console.warn(`Attempt to remove long running task that does not exist.`);
            return;
        }

        // Remove the task.
        this.runningTasks.splice(taskIndex, 1);
    }
}


/** Holds data about a promise that's supposed to be long-running, and allows management of the task. */
export class LongRunningTask {
    constructor(
        /** The name of this task for debug and identification purposes. */
        readonly name: string,
        /** The task currently running. */
        readonly task: Promise<any>,
        /** The time to wait, in MS, to release the task, and let it die. */
        readonly timeOutMs: number,
        /** OPTIONAL: Method to call if this task has timed out. */
        readonly onTimeout?: () => void,
    ) {
        // Set the start time to now.
        this.startTime = new Date();

        // Set the completion promise so that we are notified when this promise was completed.
        this._completionPromise = task.then((v) => {
            this._isComplete = true;
            return v;
        });
    }

    /** Promise used to update our completed flag when the task is complete. */
    private _completionPromise: Promise<void>;

    /** Returns a promise that will be resolved when the underlying task is complete. */
    get taskComplete(): Promise<any> {
        return this._completionPromise;
    }

    /** The date/time this task was started. */
    readonly startTime: Date;

    /** Returns the number of MS this task has been running. */
    get runningTimeMs(): number {
        return Date.now() - this.startTime.valueOf();
    }

    /** Returns a boolean value indicating whether or not htis task has been running past the timeout. */
    get shouldTimeout(): boolean {
        // If the task is complete, it's good.
        if (this.isComplete || this.isTimedOut) {
            return false;
        }

        // Check if the timeout period has past.
        return this.runningTimeMs >= this.timeOutMs;
    }

    private _isComplete = false;
    /** Returns a boolean value indicating whether or not this task has completed. */
    get isComplete() {
        return this._isComplete;
    }

    private _isTimedOut: boolean = false;
    /** Returns a boolean value indicating whether or not the timeout method has been called for this task. */
    get isTimedOut() {
        return this._isTimedOut;
    }

    /** Calls the timeout method on the task, if one was provided. */
    timeout(): void {
        // We only want to call the timeout once.
        if (this.isTimedOut) {
            return;
        }

        // Set the flag.
        this._isTimedOut = true;

        // Call the underlying method.
        if (this.onTimeout) {
            this.onTimeout();
        }
    }
}