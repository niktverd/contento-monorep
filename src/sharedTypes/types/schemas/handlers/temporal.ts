// Temporal Workflow Validation Schemas
import {z} from 'zod';

export const StartVideoDownloadingWorkflowParamsSchema = z.object({
    sourceId: z.number().positive(),
});

export const StartVideoDownloadingWorkflowResponseSchema = z.object({
    success: z.boolean(),
    workflowId: z.string().optional(),
    runId: z.string().optional(),
});

export type StartVideoDownloadingWorkflowParams = z.infer<
    typeof StartVideoDownloadingWorkflowParamsSchema
>;

export type StartVideoDownloadingWorkflowResponse = z.infer<
    typeof StartVideoDownloadingWorkflowResponseSchema
>;

export const GetWorkflowStatusParamsSchema = z.object({
    workflowId: z.string(),
});

export const GetWorkflowStatusResponseSchema = z.object({
    status: z.string().optional(),
    runId: z.string().optional(),
    startTime: z.string().optional(),
});

export type GetWorkflowStatusParams = z.infer<typeof GetWorkflowStatusParamsSchema>;
export type GetWorkflowStatusResponse = z.infer<typeof GetWorkflowStatusResponseSchema>;

export const TemporalHealthParamsSchema = z.object({});

export const TemporalHealthResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    timestamp: z.string().optional(),
});

export type TemporalHealthParams = z.infer<typeof TemporalHealthParamsSchema>;
export type TemporalHealthResponse = z.infer<typeof TemporalHealthResponseSchema>;

export const GetWorkflowResultParamsSchema = z.object({
    workflowId: z.string(),
});

export const GetWorkflowResultResponseSchema = z.object({
    success: z.boolean(),
    result: z.any(),
});

export type GetWorkflowResultParams = z.infer<typeof GetWorkflowResultParamsSchema>;
export type GetWorkflowResultResponse = z.infer<typeof GetWorkflowResultResponseSchema>;
