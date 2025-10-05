import { createInstagramContainer, downloadVideo, getAccountsActivity, getOrganizationsActivity, getRandomPreparedVideForAccountActivity, processVideo, publishInstagramPost, runProcessingActivity, runPublishingActivity } from "src/activities";
import { CreateWorkerWithRetryOptions } from "./types";

type WorkerOption = Omit<CreateWorkerWithRetryOptions, 'connection'>;

export const downloadWorkerOptions: WorkerOption = {
    name: 'downloadWorker',
    maxConcurrentActivityTaskExecutions: 15,
    maxConcurrentWorkflowTaskExecutions: 25,
    taskQueue: 'download-workflow-queue',
    activities: {
        downloadVideo,
        getAccountsActivity,
        runProcessingActivity,
    },
};

export const processInstagramVideoWorkerOptions: WorkerOption = {
    name: 'processInstagramVideoWorker',
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 15,
    taskQueue: 'process-instagram-video-queue',
    activities: {
        processVideo,
    },
};

export const publishInstagramVideoWorkerOptions: WorkerOption = {
    name: 'publishInstagramVideoWorker',
    maxConcurrentActivityTaskExecutions: 20,
    maxConcurrentWorkflowTaskExecutions: 20,
    taskQueue: 'publish-instagram-video-queue',
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
    taskQueue: 'schedule-publish-instagram-video-queue',
    activities: {
        getRandomPreparedVideForAccountActivity,
        getAccountsActivity,
        runPublishingActivity,
        getOrganizationsActivity,
    },
    stickyQueueScheduleToStartTimeout: '5m',
};
