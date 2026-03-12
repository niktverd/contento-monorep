import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Button, Table, TextInput, useToaster} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllRolesResponse, IRole} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from './Role.module.css';

export const List = () => {
    const [roles, setRoles] = useState<IRole[]>([]);
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const [filterValue, setFilterValue] = useState('');
    const navigate = useNavigate();

    const handleLoadClick = useCallback(async () => {
        const json = await fetchGet<GetAllRolesResponse>({
            route: fetchRoutes.roles.list,
            query: {},
            isProd,
        });
        setRoles(json);
        add({
            name: Math.random() + '-split',
            title: 'data loaded',
        });
    }, [add, isProd]);

    useEffect(() => {
        handleLoadClick();
    }, [handleLoadClick]);

    const filteredRoles = roles;

    const columns = [
        {id: 'name', name: 'Slug'},
        // {id: 'role', name: 'Enabled'},
        // {id: 'token', name: 'Token'},
        // {id: 'availableScenarios', name: 'Scenarios'},
        // {id: 'actions', name: 'Actions'},
    ];

    const data = filteredRoles.map((role) => ({
        ...role,
    }));

    return (
        <div className={cn.container}>
            <div className={cn.header}>
                <h2>Roles</h2>
                <div className={cn.actions}>
                    <Button view="action" onClick={handleLoadClick}>
                        Reload
                    </Button>
                    <Button view="outlined-action" href={'/roles/new'}>
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
