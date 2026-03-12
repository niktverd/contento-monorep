/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useCallback, useContext, useEffect, useState} from 'react';

import {ArrowLeft} from '@gravity-ui/icons';
import {Button, Icon, TextInput, useToaster} from '@gravity-ui/uikit';
import {useNavigate, useParams} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {IOrganization} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet, fetchPatch, fetchPost} from '../../utils/fetchHelpers';
import {deepOmit} from '../../utils/helpers/objectHelpers';

interface FormProps {
    mode?: 'create' | 'edit';
}

interface OrganizationFormData {
    name: string;
}

const DEFAULT_ORGANIZATION: OrganizationFormData = {
    name: '',
};

export const Form: React.FC<FormProps> = ({mode = 'create'}) => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<OrganizationFormData>(DEFAULT_ORGANIZATION);
    const [submitting, setSubmitting] = useState(false);

    const loadOrganization = useCallback(async () => {
        if (mode !== 'edit' || !id) return;

        setLoading(true);
        try {
            const response = await fetchGet<IOrganization>({
                route: fetchRoutes.organizations.get,
                query: {id: Number(id)},
                isProd,
            });

            if (response) {
                setFormData({
                    name: response.name || '',
                });
            }
        } catch (err: any) {
            add({
                name: 'load-error',
                title: err.message || 'Failed to load organization',
                theme: 'danger',
            });
        } finally {
            setLoading(false);
        }
    }, [id, mode, isProd, add]);

    useEffect(() => {
        loadOrganization();
    }, [loadOrganization]);

    const handleInputChange =
        (field: keyof OrganizationFormData) => (value: string | number | undefined) => {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
        };

    const validateSingleForm = (): boolean => {
        if (!formData.name) {
            add({
                name: 'validation-error',
                title: 'External ID is required',
                theme: 'danger',
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (submitting) return;
        if (!validateSingleForm()) return;

        setSubmitting(true);
        try {
            if (mode === 'edit' && id) {
                // Clean data before sending
                const cleanedData = deepOmit(formData, ['createdAt', 'updatedAt']);

                await fetchPatch({
                    route: fetchRoutes.organizations.update,
                    body: {
                        id: Number(id),
                        ...cleanedData,
                    },
                    isProd,
                });

                add({
                    name: 'update-success',
                    title: 'Organization updated successfully',
                    theme: 'success',
                });
            } else {
                // Clean data before sending
                const cleanedData = deepOmit(formData, ['createdAt', 'updatedAt']);

                await fetchPost({
                    route: fetchRoutes.organizations.create,
                    body: cleanedData,
                    isProd,
                });

                add({
                    name: 'create-success',
                    title: 'Organization created successfully',
                    theme: 'success',
                });
            }

            navigate('/organizations');
        } catch (err: any) {
            add({
                name: 'submit-error',
                title: err.message || 'Failed to save organization',
                theme: 'danger',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate('/organizations');
    };

    return (
        <div style={{padding: 20, maxWidth: 800, margin: '0 auto'}}>
            <div style={{marginBottom: 20, display: 'flex', alignItems: 'center'}}>
                <Button
                    view="flat"
                    onClick={handleBack}
                    leftContent={<Icon data={ArrowLeft} />}
                    style={{marginRight: 16}}
                >
                    Back
                </Button>
                <h2>{mode === 'edit' ? 'Edit Organization' : 'Create Organization'}</h2>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                <div>
                    <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                        Name *
                    </label>
                    <TextInput
                        value={formData.name}
                        onUpdate={handleInputChange('name')}
                        placeholder="Enter organization name"
                        size="l"
                        disabled={loading}
                    />
                </div>

                <div style={{marginTop: 24}}>
                    <Button
                        view="action"
                        size="l"
                        onClick={handleSubmit}
                        loading={submitting}
                        disabled={loading || submitting}
                    >
                        {mode === 'edit' ? 'Update' : 'Create'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
