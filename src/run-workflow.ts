import { getTemporalClient } from "./client";
// import { publishingScheduleWorkflow } from "./workflows";

async function run() {
  const client = await getTemporalClient();

  const handle = await client.workflow.start('publishingScheduleWorkflow', {
    taskQueue: 'default',
    // type inference works! args: [name: string]
    args: [],
    // in practice, use a meaningful business ID, like customerId or transactionId
    workflowId: 'workflow-' + Date.now(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  // optional: wait for client result
  console.log(JSON.stringify(await handle.result()));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});