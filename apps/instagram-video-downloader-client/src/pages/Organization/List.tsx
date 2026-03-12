import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Button, Table, TextInput, useToaster} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllOrganizationsResponse, IOrganization} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from './Organization.module.css';

export const List = () => {
    const [organizations, setOrganizations] = useState<IOrganization[]>([]);
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const [filterValue, setFilterValue] = useState('');
    const navigate = useNavigate();

    const handleLoadClick = useCallback(async () => {
        const json = await fetchGet<GetAllOrganizationsResponse>({
            route: fetchRoutes.organizations.list,
            query: {},
            isProd,
        });
        setOrganizations(json);
        add({
            name: Math.random() + '-split',
            title: 'data loaded',
        });
    }, [add, isProd]);

    useEffect(() => {
        handleLoadClick();
    }, [handleLoadClick]);

    const filteredOrganizations = organizations;

    const columns = [
        {id: 'name', name: 'Slug'},
        // {id: 'organization', name: 'Enabled'},
        // {id: 'token', name: 'Token'},
        // {id: 'availableScenarios', name: 'Scenarios'},
        // {id: 'actions', name: 'Actions'},
    ];

    const data = filteredOrganizations.map((organization) => ({
        ...organization,
    }));

    return (
        <div className={cn.container}>
            <div className={cn.header}>
                <h2>Organizations</h2>
                <div className={cn.actions}>
                    <Button view="action" onClick={handleLoadClick}>
                        Reload
                    </Button>
                    <Button view="outlined-action" href={'/organizations/new'}>
                        Add
                    </Button>
                </div>
            </div>
            <div className={cn.filter}>
                <TextInput
                    placeholder="Filter by ..."
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    size="m"
                />
            </div>
            <Table columns={columns} data={data} onRowClick={(row) => navigate(`${row.id}`)} />
        </div>
    );
};
