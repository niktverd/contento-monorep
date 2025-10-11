import { NativeConnection } from '@temporalio/worker';
import { createWorkerWithRetry, startWorker } from './utils';
import {
    downloadWorkerOptions,
    processInstagramVideoWorkerOptions,
    publishInstagramVideoWorkerOptions,
    schedulePublishInstagramVideoWorkerOptions,
} from './worker-options';
import { runScheduleWorkflow } from 'src/run-schedule-workflow';

const main = async () => {
    const address = process.env.TEMPORAL_ADDRESS;
    const connection = await NativeConnection.connect({address});

    const promises: Promise<void>[] = [];

    [
        downloadWorkerOptions,
        processInstagramVideoWorkerOptions,
        publishInstagramVideoWorkerOptions,
        schedulePublishInstagramVideoWorkerOptions,
    ].forEach(async ({name, ...workerOptions}) => {
        const worker = await createWorkerWithRetry({
            ...workerOptions,
            name,
            connection,
        });
        await startWorker(worker, name);
    })

    await Promise.all(promises);

    try {
        await runScheduleWorkflow();
    } catch(err) {
        console.error(err);
    }
};


main().catch((err) => {
  console.error(err);
  process.exit(1);
});
