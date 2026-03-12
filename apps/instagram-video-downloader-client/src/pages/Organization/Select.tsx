import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Button, Card, Text, useToaster} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {useAuth} from '../../contexts/AuthContext';
import {useOrganization} from '../../contexts/OrganizationContext';
import {GetAllOrganizationsResponse, IOrganization} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from './Organization.module.css';

export const Select = () => {
    const [organizations, setOrganizations] = useState<IOrganization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const {setOrganization} = useOrganization();
    const navigate = useNavigate();
    const {currentUser} = useAuth();

    const handleLoadOrganizations = useCallback(async () => {
        if (!currentUser?.uid) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const json = await fetchGet<GetAllOrganizationsResponse>({
                route: fetchRoutes.organizations.listByUid,
                query: {uid: currentUser?.uid},
                isProd,
            });
            setOrganizations(json);
        } catch {
            setError('Failed to load organizations. Please try again.');
            add({
                name: 'organization-load-error',
                title: 'Error',
                theme: 'danger',
                content: 'Failed to load organizations',
            });
        } finally {
            setLoading(false);
        }
    }, [add, currentUser?.uid, isProd]);

    useEffect(() => {
        handleLoadOrganizations();
    }, [handleLoadOrganizations]);

    const handleOrganizationSelect = useCallback(
        (organization: IOrganization) => {
            setOrganization(organization.id.toString(), organization.name);
            add({
                name: 'organization-selected',
                title: 'Success',
                theme: 'success',
                content: `Selected organization: ${organization.name}`,
            });
            navigate('/');
        },
        [setOrganization, add, navigate],
    );

    if (loading) {
        return (
            <div className={cn.container}>
                <div className={cn.header}>
                    <h2>Select Organization</h2>
                </div>
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <Text variant="body-1">Loading organizations...</Text>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn.container}>
                <div className={cn.header}>
                    <h2>Select Organization</h2>
                </div>
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <Text variant="body-1" color="danger">
                        {error}
                    </Text>
                    <div style={{marginTop: '1rem'}}>
                        <Button view="outlined-action" onClick={handleLoadOrganizations}>
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (organizations.length === 0) {
        return (
            <div className={cn.container}>
                <div className={cn.header}>
                    <h2>Select Organization</h2>
                </div>
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <Text variant="body-1">
                        You don&apos;t have access to any organizations. Please contact your
                        administrator.
                    </Text>
                </div>
            </div>
        );
    }

    return (
        <div className={cn.container}>
            <div className={cn.header}>
                <h2>Select Organization</h2>
                <div className={cn.actions}>
                    <Button view="outlined-action" onClick={handleLoadOrganizations}>
                        Refresh
                    </Button>
                </div>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1rem',
                    padding: '1rem 0',
                }}
            >
                {organizations.map((organization) => (
                    <Card
                        key={organization.id}
                        view="outlined"
                        style={{cursor: 'pointer'}}
                        onClick={() => handleOrganizationSelect(organization)}
                    >
                        <div style={{padding: '1rem'}}>
                            <Text variant="header-2" style={{marginBottom: '0.5rem'}}>
                                {organization.name}
                            </Text>
                            <Text variant="body-1" color="secondary">
                                ID: {organization.id}
                            </Text>
                            <div style={{marginTop: '1rem'}}>
                                <Button
                                    view="action"
                                    size="s"
                                    onClick={() => handleOrganizationSelect(organization)}
                                >
                                    Select Organization
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
