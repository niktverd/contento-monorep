import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Button, Table, TextInput} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {IScenario} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

export const List: React.FC = () => {
    const [scenarios, setScenarios] = useState<IScenario[]>([]);
    const [filterText, setFilterText] = useState('');
    const {isProd} = useContext(AppEnvContext);
    const navigate = useNavigate();

    const loadScenarios = useCallback(async () => {
        const json = await fetchGet({
            route: fetchRoutes.scenarios.list,
            query: {},
            isProd,
        });
        setScenarios(json as IScenario[]);
    }, [isProd]);

    useEffect(() => {
        loadScenarios();
    }, [loadScenarios]);

    const filteredScenarios = scenarios.filter((scenario) => {
        if (!filterText) return true;
        const search = filterText.toLowerCase();
        return (
            scenario.slug.toLowerCase().includes(search) ||
            scenario.type.toLowerCase().includes(search)
        );
    });

    return (
        <div>
            <h2>Scenarios</h2>
            <div style={{display: 'flex', gap: '10px', marginBottom: '16px'}}>
                <Button view="action" onClick={loadScenarios}>
                    Get Data
                </Button>
                <Button view="outlined-action" href="/scenario/add">
                    add
                </Button>
                <TextInput
                    placeholder="Filter by name or type..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    style={{minWidth: '300px'}}
                />
            </div>
            <Table
                data={filteredScenarios}
                columns={[
                    {id: 'slug', name: 'Slug'},
                    {id: 'type', name: 'Type'},
                    {id: 'id', name: 'ID'},
                    {
                        id: 'actions',
                        name: 'Actions',
                        template: () => null,
                    },
                ]}
                onRowClick={(row) => {
                    navigate(`/scenario/${row.id}`);
                }}
            />
        </div>
    );
};
