/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useCallback, useContext, useEffect, useState} from 'react';

import {ArrowLeft, Plus} from '@gravity-ui/icons';
import {Button, ButtonIcon, Icon, useToaster} from '@gravity-ui/uikit';
import {FieldArray, Formik, Form as FormikForm} from 'formik';
import {useNavigate, useParams} from 'react-router-dom';

import {CustomField} from '../../components/CustomField/CustomField';
import {DeleteFromArrayButton} from '../../components/Scenario/forms/components/DeleteFromArrayButton';
import {AppEnvContext} from '../../contexts/AppEnv';
import {IRole} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet, fetchPatch, fetchPost} from '../../utils/fetchHelpers';
import {deepOmit} from '../../utils/helpers/objectHelpers';

interface FormProps {
    mode?: 'create' | 'edit';
}

interface RoleFormData {
    name: string;
    description: string;
    permissions: string[];
}

const DEFAULT_ROLE: RoleFormData = {
    name: '',
    description: '',
    permissions: [],
};

export const Form: React.FC<FormProps> = ({mode = 'create'}) => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const [loading, setLoading] = useState(false);
    const [initialValues, setInitialValues] = useState<RoleFormData>(DEFAULT_ROLE);
    const [submitting, setSubmitting] = useState(false);

    const loadRole = useCallback(async () => {
        if (mode !== 'edit' || !id) return;

        setLoading(true);
        try {
            const response = await fetchGet<IRole>({
                route: fetchRoutes.roles.get,
                query: {id: Number(id)},
                isProd,
            });

            if (response) {
                setInitialValues({
                    name: response.name || '',
                    description: response.description || '',
                    permissions: response.permissions || [],
                });
            }
        } catch (err: any) {
            add({
                name: 'load-error',
                title: err.message || 'Failed to load role',
                theme: 'danger',
            });
        } finally {
            setLoading(false);
        }
    }, [id, mode, isProd, add]);

    useEffect(() => {
        loadRole();
    }, [loadRole]);

    // const handleInputChange =
    //     (field: keyof RoleFormData) => (value: string | number | undefined) => {
    //         setFormData((prev) => ({
    //             ...prev,
    //             [field]: value,
    //         }));
    //     };

    const validateSingleForm = (values: RoleFormData): boolean => {
        if (!values.name) {
            add({
                name: 'validation-error',
                title: 'External ID is required',
                theme: 'danger',
            });
            return false;
        }
        return true;
    };

    const handleSubmit = async (formData: RoleFormData) => {
        if (submitting) return;
        if (!validateSingleForm(formData)) return;

        setSubmitting(true);
        try {
            if (mode === 'edit' && id) {
                // Clean data before sending
                const cleanedData = deepOmit(formData, ['createdAt', 'updatedAt']);

                await fetchPatch({
                    route: fetchRoutes.roles.update,
                    body: {
                        id: Number(id),
                        ...cleanedData,
                    },
                    isProd,
                });

                add({
                    name: 'update-success',
                    title: 'Role updated successfully',
                    theme: 'success',
                });
            } else {
                // Clean data before sending
                const cleanedData = deepOmit(formData, ['createdAt', 'updatedAt']);

                await fetchPost({
                    route: fetchRoutes.roles.create,
                    body: cleanedData,
                    isProd,
                });

                add({
                    name: 'create-success',
                    title: 'Role created successfully',
                    theme: 'success',
                });
            }

            navigate('/roles');
        } catch (err: any) {
            add({
                name: 'submit-error',
                title: err.message || 'Failed to save role',
                theme: 'danger',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate('/roles');
    };

    if (loading) {
        return <div>loading...</div>;
    }

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
            <Formik
                initialValues={initialValues ? initialValues : DEFAULT_ROLE}
                onSubmit={(values) => {
                    // same shape as initial values
                    handleSubmit?.(values);
                }}
            >
                {({values}) => (
                    <FormikForm>
                        <div style={{backgroundColor: '#111', padding: 20, marginBlockEnd: 20}}>
                            <CustomField type="text" name="name" label="Name" />
                            <CustomField type="text" name="description" label="Description" />
                            <h2>Permissions</h2>
                            <FieldArray name="permissions">
                                {({remove, push}) => (
                                    <div>
                                        {values.permissions.length > 0 &&
                                            values.permissions.map((permission, index) => (
                                                <div style={{display: 'flex'}} key={index}>
                                                    <DeleteFromArrayButton
                                                        onClick={() => remove(index)}
                                                    />
                                                    <CustomField
                                                        name={`permissions.${index}`}
                                                        placeholder="permission"
                                                        type="text"
                                                        label={index.toString()}
                                                    />
                                                </div>
                                            ))}
                                        <Button onClick={() => push('')} view="outlined">
                                            <ButtonIcon>
                                                <Plus />
                                            </ButtonIcon>
                                        </Button>
                                    </div>
                                )}
                            </FieldArray>
                        </div>

                        <Button type="submit" view="action" size="xl">
                            Submit
                        </Button>
                    </FormikForm>
                )}
            </Formik>
            {/* <div style={{marginBottom: 20, display: 'flex', alignItems: 'center'}}>
                <Button
                    view="flat"
                    onClick={handleBack}
                    leftContent={<Icon data={ArrowLeft} />}
                    style={{marginRight: 16}}
                >
                    Back
                </Button>
                <h2>{mode === 'edit' ? 'Edit Role' : 'Create Role'}</h2>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                <div>
                    <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                        Name *
                    </label>
                    <TextInput
                        value={formData.name}
                        onUpdate={handleInputChange('name')}
                        placeholder="Enter role name"
                        size="l"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label style={{display: 'block', marginBottom: 8, fontWeight: 500}}>
                        Description *
                    </label>
                    <TextInput
                        value={formData.description}
                        onUpdate={handleInputChange('description')}
                        placeholder="Enter role description"
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
            </div> */}
        </div>
    );
};
