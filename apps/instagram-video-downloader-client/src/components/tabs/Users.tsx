import React, {useContext, useEffect, useState} from 'react';

import {
    Button,
    Card,
    // Icon,
    Modal,
    Tab,
    TabList,
    TabPanel,
    TabProvider,
    Table,
    Text,
    TextInput,
    withTableActions,
    withTableSelection,
} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {FetchRoutes2} from '../../utils/constants';
import {fetchDelete, fetchGet, fetchPost} from '../../utils/fetchHelpers';

interface UsersFormData {
    email: string;
    displayName: string;
    photoURL: string;
    providerData?: string;
    providerId?: string;
    password: string;
}

interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    providerData: string | null;
    providerId: string | null;
    password?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Enhanced table with actions and selection capabilities
const EnhancedTable = withTableActions(withTableSelection(Table));

export const Users = () => {
    // States for form
    const [formData, setFormData] = useState<UsersFormData>({
        email: '',
        displayName: '',
        photoURL: '',
        providerData: '',
        providerId: '',
        password: '',
    });

    // States for management
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('list');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const {isProd} = useContext(AppEnvContext);

    // Fetch users on component mount and when successful actions happen
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [success]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const userData = {
                email: formData.email,
                displayName: formData.displayName,
                photoURL: formData.photoURL,
                providerData: formData.providerData || '',
                providerId: formData.providerId || '',
                password: formData.password,
            };

            const response = await fetchPost({
                route: FetchRoutes2.createUser,
                body: userData,
                isProd,
            });

            if (response.error) {
                throw new Error(response.error || 'Failed to create user');
            }

            setSuccess(true);
            setFormData({
                email: '',
                displayName: '',
                photoURL: '',
                providerData: '',
                providerId: '',
                password: '',
            });

            // Switch to list tab after successful creation
            setActiveTab('list');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await fetchGet<any>({
                route: FetchRoutes2.getAllUsers,
                isProd,
            });

            if (response.error) {
                throw new Error(response.error || 'Failed to fetch users');
            }

            setUsers(response || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetchDelete({
                route: FetchRoutes2.deleteUser,
                query: {id: userToDelete.id},
                isProd,
            });

            if (response.error) {
                throw new Error(response.error || 'Failed to delete user');
            }

            setUsers(users.filter((u) => u.id !== userToDelete.id));
            setDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    // Define table columns
    const columns = [
        {
            id: 'email',
            name: 'Email',
        },
        {
            id: 'displayName',
            name: 'Display Name',
        },
        {
            id: 'photoURL',
            name: 'Photo URL',
            template: (user: User) => {
                return user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <Text>-</Text>
                );
            },
        },
        {
            id: 'actions',
            name: 'Actions',
            template: (user: User) => (
                <Button view="outlined-danger" onClick={() => handleDeleteUser(user)} size="s">
                    Delete
                </Button>
            ),
        },
    ];

    // Define row actions for the table
    const getRowActions = (user: User) => [
        {
            text: 'Delete',
            handler: () => handleDeleteUser(user),
            view: 'outlined-danger',
        },
    ];

    const renderAddUserForm = () => (
        <Card>
            <h3>Create New User</h3>

            {success && (
                <div style={{color: 'green', marginBottom: '10px'}}>User created successfully!</div>
            )}

            {error && <div style={{color: 'red', marginBottom: '10px'}}>Error: {error}</div>}

            <form onSubmit={handleSubmit}>
                <div style={{marginBottom: '10px'}}>
                    <TextInput
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                    />
                </div>

                <div style={{marginBottom: '10px'}}>
                    <TextInput
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        placeholder="Display Name"
                    />
                </div>

                <div style={{marginBottom: '10px'}}>
                    <TextInput
                        name="photoURL"
                        value={formData.photoURL}
                        onChange={handleChange}
                        placeholder="Photo URL"
                    />
                </div>

                <div style={{marginBottom: '10px'}}>
                    <TextInput
                        name="providerId"
                        value={formData.providerId || ''}
                        onChange={handleChange}
                        placeholder="Provider ID"
                    />
                </div>

                <div style={{marginBottom: '10px'}}>
                    <TextInput
                        name="providerData"
                        value={formData.providerData || ''}
                        onChange={handleChange}
                        placeholder="Provider Data"
                    />
                </div>

                <div style={{marginBottom: '20px'}}>
                    <TextInput
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                    />
                </div>

                <Button view="action" type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                </Button>
            </form>
        </Card>
    );

    const renderUsersList = () => (
        <Card>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}
            >
                <h3>User Management</h3>
                <div>
                    <Button
                        view="action"
                        onClick={() => setActiveTab('add')}
                        style={{marginRight: '10px'}}
                    >
                        Add New User
                    </Button>
                    <Button view="outlined" onClick={fetchUsers} disabled={loading}>
                        Refresh
                    </Button>
                </div>
            </div>

            {error && <div style={{color: 'red', marginBottom: '10px'}}>Error: {error}</div>}

            {loading ? (
                <div>Loading users...</div>
            ) : (
                <EnhancedTable
                    data={users}
                    columns={columns}
                    getRowId={(user) => user.id}
                    selectedIds={selectedUsers}
                    onSelectionChange={setSelectedUsers}
                    getRowActions={getRowActions}
                    emptyMessage="No users found"
                />
            )}
        </Card>
    );

    return (
        <div>
            <TabProvider value={activeTab} onUpdate={(value) => setActiveTab(value)}>
                <TabList>
                    <Tab value="list">Users List</Tab>
                    <Tab value="add">Add User</Tab>
                </TabList>
                <div style={{marginTop: '20px'}}>
                    <TabPanel value="list">{renderUsersList()}</TabPanel>
                    <TabPanel value="add">{renderAddUserForm()}</TabPanel>
                </div>
            </TabProvider>

            <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
                <div style={{padding: '20px'}}>
                    <h3>Confirm Deletion</h3>
                    <p>
                        Are you sure you want to delete the user
                        <strong> {userToDelete?.displayName || userToDelete?.email}</strong>? This
                        action cannot be undone.
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '20px',
                        }}
                    >
                        <Button view="outlined" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            view="outlined-danger"
                            onClick={confirmDeleteUser}
                            loading={loading}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
