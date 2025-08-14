import { LongTaskRunner } from "./long-running-tasks.service";

/** The LongTaskRunner for chat room operations that don't have to complete when a chat call has completed, but
 *   must complete at some point. */
const _longRunningTasks = new LongTaskRunner('Chat Room Tasks', 30000);

/** Returns the LongTaskRunner for tasks that should be maintained after a chat call until completion. */
export function getChatRoomLongRunningTasks() {
    return _longRunningTasks;
}