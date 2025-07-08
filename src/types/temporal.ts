import {z} from 'zod';

import {AccountSchema, PreparedVideoSchema, ScenarioSchema, SourceSchema} from './schemas/models';

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

export const VideoWorkflowInputSchema = DownloadVideoActivityArgsSchema.extend({
    accountId: z.number(),
    scenarioId: z.number(),
    firebaseUrl: z.string().url(),
});
export type VideoWorkflowInput = z.infer<typeof VideoWorkflowInputSchema>;

export const CreateInstagramContainerInputSchema = z.object({
    preparedVideo: PreparedVideoSchema,
});

export const CreateInstagramContainerResultSchema = z.object({
    success: z.boolean(),
    mediaContainerId: z.string().optional(),
    creationId: z.string().optional(),
    instagramMediaContainerId: z.number().optional(),
    error: z.string().optional(),
});

export const PublishInstagramPostInputSchema = z.object({
    mediaContainerId: z.string().optional(),
    account: AccountSchema.optional(),
    instagramMediaContainerId: z.number().optional(),
});

export const PublishInstagramPostResultSchema = z.object({
    success: z.boolean(),
    postId: z.string().optional(),
    error: z.string().optional(),
});

export type CreateInstagramContainerInput = z.infer<typeof CreateInstagramContainerInputSchema>;
export type CreateInstagramContainerResult = z.infer<typeof CreateInstagramContainerResultSchema>;
export type PublishInstagramPostInput = z.infer<typeof PublishInstagramPostInputSchema>;
export type PublishInstagramPostResult = z.infer<typeof PublishInstagramPostResultSchema>;

// Video Publishing Workflow
export const VideoForPublishingSchema = z.object({
    preparedVideo: PreparedVideoSchema,
});

export type VideoForPublishing = z.infer<typeof VideoForPublishingSchema>;

export const PublishVideoToInstagramActivityInputSchema = z.object({
    video: VideoForPublishingSchema,
});

export const PublishVideoToInstagramActivityResultSchema = z.object({
    success: z.boolean(),
    postId: z.string().optional(),
    error: z.string().optional(),
});

export type PublishVideoToInstagramActivityInput = z.infer<
    typeof PublishVideoToInstagramActivityInputSchema
>;
export type PublishVideoToInstagramActivityResult = z.infer<
    typeof PublishVideoToInstagramActivityResultSchema
>;

export const VideoPublishingWorkflowArgsSchema = z.object({
    // Empty for now - workflow starts without args and receives videos via signals
});

export type VideoPublishingWorkflowArgs = z.infer<typeof VideoPublishingWorkflowArgsSchema>;

// Add Run Publishing Activity Types
export const RunPublishingActivityArgsSchema = z.object({
    preparedVideo: PreparedVideoSchema,
    account: AccountSchema,
});
export type RunPublishingActivityArgs = z.infer<typeof RunPublishingActivityArgsSchema>;

export const RunPublishingActivityResponseSchema = z.object({
    success: z.boolean(),
    workflowId: z.string(),
    runId: z.string(),
});
export type RunPublishingActivityResponse = z.infer<typeof RunPublishingActivityResponseSchema>;
