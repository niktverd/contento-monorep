import {z} from 'zod';

import {AccountSchema, ScenarioSchema, SourceSchema} from './schemas/models';

// Activities
export const DownloadVideoActivityArgsSchema = z.object({
    sourceId: z.number(),
});

export const DownloadVideoActivityResponseSchema = z.object({
    success: z.boolean(),
    source: SourceSchema,
});

export type DownloadVideoActivityArgs = z.infer<typeof DownloadVideoActivityArgsSchema>;
export type DownloadVideoActivityResponse = z.infer<typeof DownloadVideoActivityResponseSchema>;

export const GetAccountsActivityResponseSchema = z.object({
    success: z.boolean(),
    accounts: z.array(AccountSchema),
});

export type GetAccountsActivityResponse = z.infer<typeof GetAccountsActivityResponseSchema>;

export const RunProcessingActivityArgsSchema = z.object({
    source: SourceSchema,
    account: AccountSchema,
    scenario: ScenarioSchema,
});

export type RunProcessingActivityArgs = z.infer<typeof RunProcessingActivityArgsSchema>;

export const RunProcessingActivityResponseSchema = z.object({
    success: z.boolean(),
    workflowId: z.string(),
    runId: z.string(),
});

export type RunProcessingActivityResponse = z.infer<typeof RunProcessingActivityResponseSchema>;
export type VideoDownloadingWorkflowArgs = z.infer<typeof DownloadVideoActivityArgsSchema>;

export const ProcessVideoActivityArgsSchema = RunProcessingActivityArgsSchema;
export const ProcessVideoActivityResponseSchema = z.object({
    success: z.boolean(),
    processedUrl: z.string(),
    duration: z.number(),
});
export type ProcessVideoActivityArgs = z.infer<typeof ProcessVideoActivityArgsSchema>;
export type ProcessVideoActivityResponse = z.infer<typeof ProcessVideoActivityResponseSchema>;
