/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useCallback, useContext, useEffect, useState} from 'react';

import {ArrowLeft, Plus, TrashBin} from '@gravity-ui/icons';
import {
    Button,
    ButtonIcon,
    Icon,
    Table,
    TableColumnConfig,
    TableDataItem,
    useToaster,
    withTableActions,
    withTableSorting,
} from '@gravity-ui/uikit';
import {FieldArray, Formik, Form as FormikForm} from 'formik';
import {useNavigate, useParams} from 'react-router-dom';

import {CustomField} from '../../components/CustomField/CustomField';
import {DeleteFromArrayButton} from '../../components/Scenario/forms/components/DeleteFromArrayButton';
import {AppEnvContext} from '../../contexts/AppEnv';
import {IOrganization, IRole, IUser} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchDelete, fetchGet, fetchPost} from '../../utils/fetchHelpers';
import {deepOmit} from '../../utils/helpers/objectHelpers';

interface FormProps {}

interface RoleFormData {
    organizationId: number;
    userId: number;
    roleIds: number[];
}

const EnhancedTable = withTableSorting(withTableActions(Table));
export const UsersForm: React.FC<FormProps> = () => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const [loading, setLoading] = useState(false);
    const [organization, setOrganization] = useState<IOrganization | null>(null);
    const [roles, setRoles] = useState<IRole[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const loadRole = useCallback(async () => {
        setLoading(true);
        try {
            // const organization = await fetchGet<IOrganization>({
            const [organizationLocal, rolesLocal, usersLocal] = await Promise.all([
                fetchGet<any>({
                    route: fetchRoutes.organizations.get,
                    query: {id: Number(id)},
                    isProd,
                }),
                fetchGet<IRole[]>({
                    route: fetchRoutes.roles.list,
                    isProd,
                }),
                fetchGet<IUser[]>({
                    route: fetchRoutes.users.list,
                    isProd,
                }),
            ]);

            if (organizationLocal) {
                setOrganization(organizationLocal);
            }

            if (rolesLocal) {
                setRoles(rolesLocal);
            }

            if (usersLocal) {
                setUsers(usersLocal);
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
    }, [id, isProd, add]);

    useEffect(() => {
        loadRole();
    }, [loadRole]);

    const validateSingleForm = (values: RoleFormData): boolean => {
        if (!values.organizationId || !values.userId || !values.roleIds.length) {
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
            // Clean data before sending
            const transformedData: RoleFormData = {
                roleIds: formData.roleIds.map((roleId) => Number(roleId)),
                organizationId: Number(id),
                userId: Number(formData.userId),
            };
            const cleanedData = deepOmit(transformedData, ['createdAt', 'updatedAt']);

            await fetchPost({
                route: fetchRoutes.organizations.addUserWithRolesToOrganization,
                body: cleanedData,
                isProd,
            });

            add({
                name: 'create-success',
                title: 'Role created successfully',
                theme: 'success',
            });

            navigate(`/organizations/${id}`);
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
        navigate(`/organizations/${id}`);
    };

    const columns: TableColumnConfig<TableDataItem>[] = [
        {
            id: 'id',
            name: 'id',
        },
        {
            id: 'name',
            name: 'User Name',
            template: (item: IUser) => <span>{item.name}</span>,
        },
        {
            id: 'email',
            name: 'email',
            template: (item: IUser) => <span>{item.email}</span>,
        },
        {
            id: 'roles',
            name: 'Roles',
            template: (item: IUser) => (
                <span>{item.roles?.map((role) => role.name).join(', ')}</span>
            ),
        },
        {
            id: 'actions',
            name: 'Actions',
            template: (item: IUser) => (
                <div>
                    <Button
                        view="flat-danger"
                        size="s"
                        onClick={async () => {
                            const response = await fetchDelete<IOrganization>({
                                route: fetchRoutes.organizations.deletUserFromOrganization,
                                body: {organizationId: id, userId: item.id},
                                isProd,
                            });

                            if (response) {
                                setOrganization(response);
                            }
                        }}
                    >
                        <ButtonIcon>
                            <TrashBin />
                        </ButtonIcon>
                    </Button>
                </div>
            ),
        },
    ];

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
                <h2>Manage users</h2>
            </div>
            <div>
                <EnhancedTable
                    data={(organization as any)?.users || []}
                    columns={columns}
                    getRowId={(item) => item.id}
                    // sortState={[{column: sortOrder.columnId, order: sortOrder.order}]}
                    // onSortStateChange={(sort) => handleSortChange(sort[0])}
                    // loading={loading}
                    emptyMessage="No users found"
                    // onSelectionChange={() => {}}
                    // selectedIds={[]}
                />
            </div>
            <Formik
                initialValues={{
                    organizationId: Number(id),
                    userId: users?.[0]?.id || 0,
                    roleIds: [],
                }}
                onSubmit={(values) => {
                    // same shape as initial values
                    handleSubmit?.(values);
                }}
            >
                {({values}) => (
                    <FormikForm>
                        <div style={{backgroundColor: '#111', padding: 20, marginBlockEnd: 20}}>
                            <CustomField name="userId" placeholder="User *" as="select">
                                {users.map(({name, id: userIdLocal, email}) => {
                                    const userLabel = `${name} (${userIdLocal}) (${email})`;
                                    return (
                                        <option key={userLabel} value={userIdLocal}>
                                            {userLabel}
                                        </option>
                                    );
                                })}
                            </CustomField>
                            <h2>Roles</h2>
                            <FieldArray name="roleIds">
                                {({remove, push}) => (
                                    <div>
                                        {values.roleIds.length > 0 &&
                                            values.roleIds.map((_roleId, index) => (
                                                <div style={{display: 'flex'}} key={index}>
                                                    <DeleteFromArrayButton
                                                        onClick={() => remove(index)}
                                                    />
                                                    <CustomField
                                                        name={`roleIds.${index}`}
                                                        placeholder="User *"
                                                        as="select"
                                                        onChange={(
                                                            e: React.ChangeEvent<HTMLSelectElement>,
                                                        ) => {
                                                            const newValue = Number(e.target.value);
                                                            // eslint-disable-next-line no-param-reassign
                                                            values.roleIds[index] = newValue;
                                                        }}
                                                    >
                                                        {roles.map(({name, id: roleIdLocal}) => {
                                                            return (
                                                                <option
                                                                    key={name}
                                                                    value={roleIdLocal}
                                                                >
                                                                    {name} {typeof roleIdLocal}
                                                                </option>
                                                            );
                                                        })}
                                                    </CustomField>
                                                </div>
                                            ))}
                                        <Button
                                            onClick={() => push(roles[0]?.id || 0)}
                                            view="outlined"
                                        >
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
        </div>
    );
};
