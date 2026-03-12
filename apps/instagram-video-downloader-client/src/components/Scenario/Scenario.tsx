/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useContext, useState} from 'react';

import {ArrowDown, ArrowUp} from '@gravity-ui/icons';
import {Button, Card, Modal} from '@gravity-ui/uikit';
import {omit} from 'lodash';

import {AppEnvContext} from '../../contexts/AppEnv';
import {IScenario} from '../../sharedTypes';
import {FetchRoutes2} from '../../utils/constants';
import {fetchPatch, fetchPost} from '../../utils/fetchHelpers';

import {ScenarioRouter} from './forms/ScenarioRouter';

import cn from './Scenario.module.css';

interface ScenarioProps extends IScenario {
    onDelete?: () => void;
    onUpdate?: (values: any) => void;
}

export const Scenario = (props: ScenarioProps) => {
    const [openModal, setOpenModal] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const {slug, id, onDelete, onUpdate, ...extra} = props;
    const {isProd} = useContext(AppEnvContext);

    return (
        <Card className={cn.container} type="container" view="outlined">
            <div className={cn.header}>
                <div className={cn.title}>
                    <h2>{slug}</h2>
                    <p className={cn.id}>{id}</p>
                </div>
                <div className={cn.actions}>
                    <Button onClick={() => setOpenModal(true)}>Edit</Button>
                    {onDelete && (
                        <Button view="outlined-danger" onClick={onDelete}>
                            Delete
                        </Button>
                    )}
                    {/* <Button
                        onClick={async () => {
                            await fetchPost({
                                route: FetchRoutes2.addScenario,
                                body: {
                                    values: {
                                        ...omit(props, 'id', 'onDelete', 'onUpdate'),
                                        copiedFrom: props.id,
                                    },
                                } as any,
                                isProd: !isProd,
                            });
                        }}
                    >
                        Copy to {isProd ? 'preprod' : 'prod'}
                    </Button> */}
                    <Button
                        onClick={async () => {
                            await fetchPost({
                                route: FetchRoutes2.addScenario,
                                body: {
                                    ...omit(
                                        props,
                                        'id',
                                        'onDelete',
                                        'onUpdate',
                                        'createdAt',
                                        'updatedAt',
                                    ),
                                    slug: `${slug} (clone)`,
                                    copied_from: props.id,
                                } as any,
                                isProd,
                            });
                        }}
                    >
                        Clone
                    </Button>
                    <Button
                        view="flat"
                        onClick={() => setExpanded(!expanded)}
                        className={cn.toggleButton}
                    >
                        {expanded ? <ArrowUp /> : <ArrowDown />}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className={cn.details}>
                    <pre>{JSON.stringify(extra, null, 3)}</pre>
                </div>
            )}
            <Modal
                className="modal"
                open={openModal}
                contentClassName={cn.modal}
                onClose={() => setOpenModal(false)}
            >
                <ScenarioRouter
                    initialValues={{...extra, slug, id}}
                    onSubmit={async (values: any) => {
                        if (onUpdate) {
                            onUpdate({...values, id});
                        } else {
                            await fetchPatch({
                                route: FetchRoutes2.patchScenario,
                                body: {id, slug, ...values},
                                isProd,
                            });
                        }
                        setOpenModal(false);
                    }}
                />
            </Modal>
        </Card>
    );
};
