import { createInstagramContainer, downloadVideo, getAccountsActivity, getOrganizationsActivity, getRandomPreparedVideForAccountActivity, processVideo, publishInstagramPost, runProcessingActivity, runPublishingActivity } from "src/activities";
import { CreateWorkerWithRetryOptions } from "./types";
import { DOWNLOADING_NAME, PROCESS_VIDEO_NAME, PROCESS_VIDEO_PUBLISHING_NAME, SCHEDULE_NAME } from "src/queues";

type WorkerOption = Omit<CreateWorkerWithRetryOptions, 'connection'>;

export const downloadWorkerOptions: WorkerOption = {
    name: 'downloadWorker',
    maxConcurrentActivityTaskExecutions: 15,
    maxConcurrentWorkflowTaskExecutions: 25,
    taskQueue: DOWNLOADING_NAME,
    activities: {
        downloadVideo,
        getAccountsActivity,
        runProcessingActivity,
    },
};

export const processInstagramVideoWorkerOptions: WorkerOption = {
    name: 'processVideoWorker',
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 15,
    taskQueue: PROCESS_VIDEO_NAME,
    activities: {
        processVideo,
    },
};

export const publishInstagramVideoWorkerOptions: WorkerOption = {
    name: 'publishInstagramVideoWorker',
    maxConcurrentActivityTaskExecutions: 20,
    maxConcurrentWorkflowTaskExecutions: 20,
    taskQueue: PROCESS_VIDEO_PUBLISHING_NAME,
    activities: {
        createInstagramContainer,
        publishInstagramPost,
    },
    stickyQueueScheduleToStartTimeout: '5m',
};

export const schedulePublishInstagramVideoWorkerOptions: WorkerOption = {
    name: 'schedulePublishInstagramVideoWorker',
    maxConcurrentActivityTaskExecutions: 20,
    maxConcurrentWorkflowTaskExecutions: 20,
    taskQueue: SCHEDULE_NAME,
    activities: {
        getRandomPreparedVideForAccountActivity,
        getAccountsActivity,
        runPublishingActivity,
        getOrganizationsActivity,
    },
    stickyQueueScheduleToStartTimeout: '5m',
};
