import {
    createCloudRunScenarioExecution,
    getAllCloudRunScenarioExecution,
    updateCloudRunScenarioExecutionStatus,
} from '#src/db/cloudRunScenarioExecutions';
import {wrapper} from '#src/db/utils';
import {
    CloudRunScenarioExecutionParams,
    CloudRunScenarioExecutionParamsSchema,
    CreateCloudRunScenarioExecutionResponse,
    GetAllCloudRunScenarioExecutionParams,
    GetAllCloudRunScenarioExecutionsParamsSchema,
    GetCloudRunScenarioExecutionResponse,
    UpdateCloudRunScenarioExecutionParams,
    UpdateCloudRunScenarioExecutionParamsSchema,
    UpdateCloudRunScenarioExecutionResponse,
} from '#src/types/schemas/handlers/cloudRunScenarioExecution';

export const createCloudRunScenarioExecutionPost = wrapper<
    CloudRunScenarioExecutionParams,
    CreateCloudRunScenarioExecutionResponse
>(createCloudRunScenarioExecution, CloudRunScenarioExecutionParamsSchema, 'POST');

export const getAllCloudRunScenarioExecutionGet = wrapper<
    GetAllCloudRunScenarioExecutionParams,
    GetCloudRunScenarioExecutionResponse
>(getAllCloudRunScenarioExecution, GetAllCloudRunScenarioExecutionsParamsSchema, 'GET');

export const updateCloudRunScenarioExecutionStatusPatch = wrapper<
    UpdateCloudRunScenarioExecutionParams,
    UpdateCloudRunScenarioExecutionResponse
>(updateCloudRunScenarioExecutionStatus, UpdateCloudRunScenarioExecutionParamsSchema, 'PATCH');
