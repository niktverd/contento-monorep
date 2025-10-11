import { getTemporalClient } from "./client";
import { SCHEDULE_NAME } from "./queues";
// import { publishingScheduleWorkflow } from "./workflows";

export const runScheduleWorkflow = async () => {
  const client = await getTemporalClient();

  const handle = await client.workflow.start('publishingScheduleWorkflow', {
    taskQueue: SCHEDULE_NAME,
    // type inference works! args: [name: string]
    args: [],
    // in practice, use a meaningful business ID, like customerId or transactionId
    workflowId: 'workflow-schedule',
  });
  console.log(`Started workflow ${handle.workflowId}`);

  // optional: wait for client result
  console.log(JSON.stringify(await handle.result()));
};
