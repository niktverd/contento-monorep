import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Button, Table, TextInput, Tooltip, useToaster} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllAccountsResponse, IAccount} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from './Accounts.module.css';

export const List = () => {
    const [accounts, setAccounts] = useState<IAccount[]>([]);
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const [filterValue, setFilterValue] = useState('');
    const navigate = useNavigate();

    const handleLoadClick = useCallback(async () => {
        const json = await fetchGet<GetAllAccountsResponse>({
            route: fetchRoutes.accounts.list,
            query: {},
            isProd,
        });
        setAccounts(json);
        add({
            name: Math.random() + '-split',
            title: 'data loaded',
        });
    }, [add, isProd]);

    useEffect(() => {
        handleLoadClick();
    }, [handleLoadClick]);

    const filteredAccounts = accounts.filter((account) => {
        if (!filterValue) return true;
        const lowercasedFilter = filterValue.toLowerCase();
        if (account.slug && account.slug.toLowerCase().includes(lowercasedFilter)) {
            return true;
        }
        if (account.availableScenarios && Array.isArray(account.availableScenarios)) {
            return account.availableScenarios.some(
                (scenario) =>
                    scenario?.slug && scenario.slug.toLowerCase().includes(lowercasedFilter),
            );
        }
        return false;
    });

    const columns = [
        {id: 'slug', name: 'Slug'},
        {id: 'enabled', name: 'Enabled'},
        {id: 'token', name: 'Token'},
        {id: 'availableScenarios', name: 'Scenarios'},
        {id: 'actions', name: 'Actions'},
    ];

    const data = filteredAccounts.map((account) => ({
        ...account,
        enabled: account.enabled ? 'Yes' : 'No',
        token: account.token ? account.token.slice(0, 3) + '****' : '',
        availableScenarios: (
            <Tooltip
                content={account.availableScenarios.map((scenario) => scenario.slug).join(', ')}
            >
                <div style={{textAlign: 'center'}}>{account.availableScenarios.length}</div>
            </Tooltip>
        ),
        actions: null,
    }));

    return (
        <div className={cn.container}>
            <div className={cn.header}>
                <h2>Accounts</h2>
                <div className={cn.actions}>
                    <Button view="action" onClick={handleLoadClick}>
                        Reload
                    </Button>
                    <Button view="outlined-action" href={'/account/new'}>
                        Add
                    </Button>
                </div>
            </div>
            <div className={cn.filter}>
                <TextInput
                    placeholder="Filter by ID or scenario..."
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    size="m"
                />
            </div>
            <Table columns={columns} data={data} onRowClick={(row) => navigate(`${row.id}`)} />
        </div>
    );
};
