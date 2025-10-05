import { Duration } from "@temporalio/common";
import { NativeConnection } from "@temporalio/worker";

export type CreateWorkerWithRetryOptions = {
    name: string;
    connection: NativeConnection,
    activities: object,
    maxConcurrentActivityTaskExecutions: number,
    maxConcurrentWorkflowTaskExecutions: number,
    taskQueue: string,
    stickyQueueScheduleToStartTimeout?: Duration,
};