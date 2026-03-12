import {
    createScenario,
    deleteScenario,
    getAllScenarios,
    getScenarioById,
    updateScenario,
} from '../../db/scenario';
import {wrapper} from '../../db/utils';
import {
    CreateScenarioParams,
    CreateScenarioResponse,
    DeleteScenarioParams,
    DeleteScenarioResponse,
    GetAllScenariosParams,
    GetAllScenariosResponse,
    GetScenarioByIdParams,
    GetScenarioByIdResponse,
    UpdateScenarioParams,
    UpdateScenarioResponse,
} from '../../types';
import {
    CreateScenarioParamsSchema,
    DeleteScenarioParamsSchema,
    GetAllScenariosParamsSchema,
    GetScenarioByIdParamsSchema,
    UpdateScenarioParamsSchema,
} from '../../types/schemas/handlers/scenario';

export const createScenarioPost = wrapper<CreateScenarioParams, CreateScenarioResponse>(
    createScenario,
    CreateScenarioParamsSchema,
    'POST',
);

export const getScenarioByIdGet = wrapper<GetScenarioByIdParams, GetScenarioByIdResponse>(
    getScenarioById,
    GetScenarioByIdParamsSchema,
    'GET',
);

export const getAllScenariosGet = wrapper<GetAllScenariosParams, GetAllScenariosResponse>(
    getAllScenarios,
    GetAllScenariosParamsSchema,
    'GET',
);

export const updateScenarioPatch = wrapper<UpdateScenarioParams, UpdateScenarioResponse>(
    updateScenario,
    UpdateScenarioParamsSchema,
    'PATCH',
);

export const deleteScenarioDelete = wrapper<DeleteScenarioParams, DeleteScenarioResponse>(
    deleteScenario,
    DeleteScenarioParamsSchema,
    'DELETE',
);
