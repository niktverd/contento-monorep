import { Client, Connection } from "@temporalio/client";
import { publishingScheduleWorkflow } from "./workflows";

let temporalClient: Client | null = null;

const {log} = console;
// eslint-disable-next-line valid-jsdoc
/**
 * Get or create Temporal client instance
 * Singleton pattern to reuse connection
 */
export async function getTemporalClient(): Promise<Client> {
    if (!temporalClient) {
        const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
        const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

        const connection = await Connection.connect({
            address,
        });

        temporalClient = new Client({
            connection,
            namespace,
        });

        log(`Temporal client connected to ${address}, namespace: ${namespace}`);
    }

    return temporalClient;
}