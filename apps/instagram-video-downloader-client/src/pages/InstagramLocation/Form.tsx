import React, {useCallback, useContext, useEffect, useState} from 'react';

import {ArrowLeft} from '@gravity-ui/icons';
import {Button, Icon, TextInput, useToaster} from '@gravity-ui/uikit';
import {useNavigate, useParams} from 'react-router-dom';

import BulkForm from '../../components/InstagramLocation/BulkForm';
import {AppEnvContext} from '../../contexts/AppEnv';
import {IInstagramLocation} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet, fetchPatch, fetchPost} from '../../utils/fetchHelpers';
import {deepOmit} from '../../utils/helpers/objectHelpers';

interface FormProps {
    mode?: 'create' | 'edit';
}

interface LocationFormData {
    externalId: string;
    externalIdSource?: string;
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    group?: string;
}

const DEFAULT_LOCATION: LocationFormData = {
    externalId: '',
    externalIdSource: '',
    name: '',
    address: '',
    lat: undefined,
    lng: undefined,
    group: '',
};

const Form: React.FC<FormProps> = ({mode = 'create'}) => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const [formMode, setFormMode] = useState<'single' | 'bulk'>('single');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<LocationFormData>(DEFAULT_LOCATION);
    const [submitting, setSubmitting] = useState(false);

    const loadLocation = useCallback(async () => {
        if (mode !== 'edit' || !id) return;

        setLoading(true);
        try {
            const response = await fetchGet<IInstagramLocation>({
                route: fetchRoutes.instagramLocations.get,
                query: {id: Number(id)},
                isProd,
            });

            if (response) {
                setFormData({
                    externalId: response.externalId || '',
                    externalIdSource: response.externalIdSource || '',
                    name: response.name || '',
                    address: response.address || '',
                    lat: response.lat,
                    lng: response.lng,
                    group: response.group || '',
                });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            add({
                name: 'load-error',
                title: err.message || 'Failed to load location',
                theme: 'danger',
            });
        } finally {
            setLoading(false);
        }
    }, [id, mode, isProd, add]);

    useEffect(() => {
        loadLocation();
    }, [loadLocation]);

    const handleInputChange =
        (field: keyof LocationFormData) => (value: string | number | undefined) => {
            setFormData((prev) => ({
                ...prev,
                [field]: field === 'lat' || field === 'lng' ? Number(value) || undefined : value,
            }));
        };

    const validateSingleForm = (): boolean => {
        if (!formData.externalId) {
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
                    route: fetchRoutes.instagramLocations.update,
                    body: {
                        id: Number(id),
                        ...cleanedData,
                    },
                    isProd,
                });

                add({
                    name: 'update-success',
                    title: 'Location updated successfully',
                    theme: 'success',
                });
            } else {
                // Clean data before sending
                const cleanedData = deepOmit(formData, ['createdAt', 'updatedAt']);

                await fetchPost({
                    route: fetchRoutes.instagramLocations.create,
                    body: cleanedData,
                    isProd,
                });

                add({
                    name: 'create-success',
                    title: 'Location created successfully',
                    theme: 'success',
                });
            }

            navigate('/instagram-locations');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            add({
                name: 'submit-error',
                title: err.message || 'Failed to save location',
                theme: 'danger',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate('/instagram-locations');
    };

    const handleBulkSuccess = () => {
        navigate('/instagram-locations');
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
                <h2>{mode === 'edit' ? 'Edit Location' : 'Create Location'}</h2>
            </div>

            {mode === 'create' && (
                <div style={{marginBottom: 20, display: 'flex', gap: 10}}>
                    <Button
                        view={formMode === 'single' ? 'action' : 'normal'}
                        onClick={() => setFormMode('single')}
                    >
                        Single Location
                    </Button>
                    <Button
                        view={formMode === 'bulk' ? 'action' : 'normal'}
                        onClick={() => setFormMode('bulk')}
                    >
                        Bulk Import
                    </Button>
                </div>
            )}

            {formMode === 'single' ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                    <div>
                        <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                            External ID *
                        </label>
                        <TextInput
                            value={formData.externalId}
                            onUpdate={handleInputChange('externalId')}
                            placeholder="Enter external ID"
                            size="l"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                            External ID Source
                        </label>
                        <TextInput
                            value={formData.externalIdSource || ''}
                            onUpdate={handleInputChange('externalIdSource')}
                            placeholder="Enter external ID source"
                            size="l"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                            Name
                        </label>
                        <TextInput
                            value={formData.name || ''}
                            onUpdate={handleInputChange('name')}
                            placeholder="Enter location name"
                            size="l"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                            Address
                        </label>
                        <TextInput
                            value={formData.address || ''}
                            onUpdate={handleInputChange('address')}
                            placeholder="Enter address"
                            size="l"
                            disabled={loading}
                        />
                    </div>

                    <div style={{display: 'flex', gap: 16}}>
                        <div style={{flex: 1}}>
                            <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                                Latitude
                            </label>
                            <TextInput
                                value={formData.lat?.toString() || ''}
                                onUpdate={handleInputChange('lat')}
                                placeholder="Enter latitude"
                                size="l"
                                disabled={loading}
                            />
                        </div>

                        <div style={{flex: 1}}>
                            <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                                Longitude
                            </label>
                            <TextInput
                                value={formData.lng?.toString() || ''}
                                onUpdate={handleInputChange('lng')}
                                placeholder="Enter longitude"
                                size="l"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                            Group
                        </label>
                        <TextInput
                            value={formData.group || ''}
                            onUpdate={handleInputChange('group')}
                            placeholder="Enter group"
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
            ) : (
                <BulkForm isProd={isProd} onSuccess={handleBulkSuccess} />
            )}
        </div>
    );
};

export default Form;
