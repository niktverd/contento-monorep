import React, {useContext, useEffect, useState} from 'react';

import {useNavigate, useParams} from 'react-router-dom';

import {AddAccount} from '../../components/Account/forms/AddAccount';
import {AppEnvContext} from '../../contexts/AppEnv';
import {IAccount} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet, fetchPatch, fetchPost} from '../../utils/fetchHelpers';
import {deepOmit} from '../../utils/helpers/objectHelpers';

interface FormProps {
    mode: 'create' | 'edit';
}

export const Form = ({mode}: FormProps) => {
    const {id} = useParams();
    const {isProd} = useContext(AppEnvContext);
    const [initialValues, setInitialValues] = useState<IAccount | undefined>();
    const [loading, setLoading] = useState(mode === 'edit');
    const navigate = useNavigate();

    useEffect(() => {
        if (mode === 'edit' && id) {
            setLoading(true);
            fetchGet<IAccount>({
                route: fetchRoutes.accounts.get,
                query: {id},
                isProd,
            })
                .then(setInitialValues)
                .finally(() => setLoading(false));
        }
    }, [mode, id, isProd]);

    if (loading) return <div>Loading...</div>;

    return (
        <AddAccount
            initialValues={mode === 'edit' ? initialValues : undefined}
            onSubmit={async (values: IAccount) => {
                // Recursively remove createdAt and updatedAt fields at all levels
                const cleanedValues = deepOmit(values, ['createdAt', 'updatedAt']);

                if (mode === 'edit' && id) {
                    await fetchPatch({
                        route: fetchRoutes.accounts.update,
                        body: {...cleanedValues, id},
                        isProd,
                    });
                    navigate(`../${id}`);
                } else {
                    await fetchPost({
                        route: fetchRoutes.accounts.create,
                        body: {...cleanedValues},
                        isProd,
                    });
                    navigate('..');
                }
            }}
        />
    );
};
