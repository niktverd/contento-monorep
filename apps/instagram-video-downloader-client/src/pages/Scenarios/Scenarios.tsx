/* eslint-disable import/no-extraneous-dependencies */
import React, {useCallback, useContext, useState} from 'react';

import {Button, Modal, TextInput, useToaster} from '@gravity-ui/uikit';

import {Scenario} from '../../components/Scenario/Scenario';
import {ScenarioRouter} from '../../components/Scenario/forms/ScenarioRouter';
import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllScenariosResponse, IScenario} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {FetchRoutes2} from '../../utils/constants';
import {fetchDelete, fetchGet, fetchPatch, fetchPost} from '../../utils/fetchHelpers';

import cn from './Scenarios.module.css';

export const Scenarios = () => {
    const [scenarios, setScenarios] = useState<IScenario[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [filterText, setFilterText] = useState('');
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);

    const handleLoadClick = useCallback(async () => {
        const json = await fetchGet<GetAllScenariosResponse>({
            route: fetchRoutes.scenarios.list,
            query: {},
            isProd,
        });

        setScenarios(json);
    }, [isProd]);

    const handleCreateVideoClick = useCallback(async () => {
        const json = await fetchGet({
            route: FetchRoutes2.createVideoByScenario,
            query: {},
            isProd,
        });

        add({
            name: Math.random() + '-create-video',
            title: JSON.stringify(json),
            theme: 'info',
        });
    }, [add, isProd]);

    const handleDeleteScenario = useCallback(
        async (id) => {
            await fetchDelete({
                route: FetchRoutes2.deleteScenario,
                query: {id},
                isProd,
            });

            // Refresh the scenarios list
            handleLoadClick();

            add({
                name: Math.random() + '-delete-scenario',
                title: 'Scenario deleted successfully',
                theme: 'success',
            });
        },
        [add, handleLoadClick, isProd],
    );

    const handleUpdateScenario = useCallback(
        async (values) => {
            await fetchPatch({
                route: FetchRoutes2.patchScenario,
                body: {...values},
                isProd,
            });

            // Refresh the scenarios list
            handleLoadClick();

            add({
                name: Math.random() + '-update-scenario',
                title: 'Scenario updated successfully',
                theme: 'success',
            });
        },
        [add, handleLoadClick, isProd],
    );

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
                <Button view="action" onClick={handleLoadClick}>
                    Get Data
                </Button>
                <Button view="outlined-action" onClick={() => setOpenModal(true)}>
                    add
                </Button>
                <Button view="outlined-action" onClick={handleCreateVideoClick}>
                    create video
                </Button>
                <TextInput
                    placeholder="Filter by name or type..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    style={{minWidth: '300px'}}
                />
            </div>
            <div style={{margin: 64, maxWidth: 1000}}>
                {filteredScenarios.map((scenario) => {
                    return (
                        <Scenario
                            key={scenario.id}
                            {...scenario}
                            onDelete={() => handleDeleteScenario(scenario.id)}
                            onUpdate={(values) => handleUpdateScenario(values)}
                        />
                    );
                })}
            </div>
            <Modal open={openModal} onClose={() => setOpenModal(false)} contentClassName={cn.modal}>
                <ScenarioRouter
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onSubmit={async (values: any) => {
                        await fetchPost({
                            route: FetchRoutes2.addScenario,
                            body: {...values},
                            isProd,
                        });
                        setOpenModal(false);
                        // Refresh scenarios after adding
                        handleLoadClick();
                    }}
                />
            </Modal>
        </div>
    );
};
