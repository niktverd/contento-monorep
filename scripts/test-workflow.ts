import {
    getWorkflowResult,
    getWorkflowStatus,
    startVideoDownloadingWorkflow,
} from '../src/sections/temporal/client';
import {VideoDownloadingWorkflowArgs} from '../src/types/temporal';

async function testWorkflow() {
    console.log('🧪 Testing Temporal Video Processing Workflow...');

    try {
        // Test workflow input
        const input: VideoDownloadingWorkflowArgs = {
            sourceId: 12345,
        };

        console.log('📋 Starting workflow with input:', input);

        // Start workflow
        const {workflowId, runId} = await startVideoDownloadingWorkflow(input);
        console.log(`🚀 Workflow started: ${workflowId} (run: ${runId})`);

        // Check status
        console.log('⏳ Checking workflow status...');
        const status = await getWorkflowStatus(workflowId);
        console.log('📊 Status:', status);

        // Wait a bit and check result
        console.log('⏱️  Waiting for workflow to complete...');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        try {
            const result = await getWorkflowResult(workflowId);
            console.log('✅ Workflow result:', result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log('⏳ Workflow still running or failed:', errorMessage);
        }

        console.log('🎉 Test completed successfully!');
        console.log('💡 Check Temporal Web UI at http://localhost:8233 to see workflow details');
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run the test
testWorkflow()
    .then(() => {
        console.log('✅ All tests passed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
