import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Button, Table, TextInput, useToaster} from '@gravity-ui/uikit';
// import {useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllUsersResponse, IUser} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from './User.module.css';

export const List = () => {
    const [users, setUsers] = useState<IUser[]>([]);
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const [filterValue, setFilterValue] = useState('');
    // const navigate = useNavigate();

    const handleLoadClick = useCallback(async () => {
        const json = await fetchGet<GetAllUsersResponse>({
            route: fetchRoutes.users.list,
            query: {},
            isProd,
        });
        setUsers(json);
        add({
            name: Math.random() + '-split',
            title: 'data loaded',
        });
    }, [add, isProd]);

    useEffect(() => {
        handleLoadClick();
    }, [handleLoadClick]);

    const filteredUsers = users.filter(({name, uid, email}) => {
        if (filterValue.trim()) {
            return (
                name.includes(filterValue) ||
                uid.includes(filterValue) ||
                email.includes(filterValue)
            );
        }

        return true;
    });

    const columns = [
        {id: 'name', name: 'Slug'},
        {id: 'uid', name: 'UID'},
        {id: 'email', name: 'email'},
        // {id: 'availableScenarios', name: 'Scenarios'},
        // {id: 'actions', name: 'Actions'},
    ];

    const data = filteredUsers.map((user) => ({
        ...user,
    }));

    return (
        <div className={cn.container}>
            <div className={cn.header}>
                <h2>Users</h2>
                <div className={cn.actions}>
                    <Button view="action" onClick={handleLoadClick}>
                        Reload
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
            <Table columns={columns} data={data} />
        </div>
    );
};
