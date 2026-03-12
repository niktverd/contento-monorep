import React, {useCallback, useContext, useEffect, useState} from 'react';

import {useToaster} from '@gravity-ui/uikit';
import {useNavigate, useParams} from 'react-router-dom';

import {ScenarioRouter} from '../../components/Scenario/forms/ScenarioRouter';
import {AppEnvContext} from '../../contexts/AppEnv';
import {IScenario} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet, fetchPatch, fetchPost} from '../../utils/fetchHelpers';
import {deepOmit} from '../../utils/helpers/objectHelpers';

export const Form: React.FC = () => {
    const {id} = useParams<{id?: string}>();
    const [initialValues, setInitialValues] = useState<IScenario | undefined>(undefined);
    const [loading, setLoading] = useState(Boolean(id));
    const [error, setError] = useState<string | null>(null);
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            setLoading(true);
            setError(null);
            fetchGet({
                route: fetchRoutes.scenarios.get,
                query: {id},
                isProd,
            })
                .then((json) => setInitialValues(json as IScenario))
                .catch(() => setError('Failed to load scenario'))
                .finally(() => setLoading(false));
        }
    }, [id, isProd]);

    const handleSubmit = useCallback(
        async (values: IScenario) => {
            // Remove createdAt and updatedAt fields from all nested objects
            const cleanedValues = deepOmit(values, ['createdAt', 'updatedAt']);

            if (id) {
                await fetchPatch({
                    route: fetchRoutes.scenarios.update,
                    body: {...cleanedValues, id},
                    isProd,
                });
                add({
                    name: Math.random() + '-update-scenario',
                    title: 'Scenario updated successfully',
                    theme: 'success',
                });
            } else {
                await fetchPost({
                    route: fetchRoutes.scenarios.create,
                    body: {...cleanedValues},
                    isProd,
                });
                add({
                    name: Math.random() + '-add-scenario',
                    title: 'Scenario added successfully',
                    theme: 'success',
                });
            }
            navigate('/scenario');
        },
        [id, isProd, add, navigate],
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return <ScenarioRouter initialValues={initialValues} onSubmit={handleSubmit} />;
};
