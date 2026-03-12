import React, {useContext, useEffect, useState} from 'react';

import {DiamondExclamation, Display, Globe, MapPin} from '@gravity-ui/icons';
import {useParams} from 'react-router-dom';

import {CardConfig, CardTemplate} from '../../components/CardTemplate/CardTemplate';
import {AppEnvContext} from '../../contexts/AppEnv';
import {IRole} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from './Role.module.css';

export const Overview = () => {
    const {id} = useParams();
    const {isProd} = useContext(AppEnvContext);
    const [role, setRole] = useState<IRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [showJson, setShowJson] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchGet<IRole>({
            route: fetchRoutes.roles.get,
            query: {id},
            isProd,
        })
            .then(setRole)
            .finally(() => setLoading(false));
    }, [id, isProd]);

    if (loading) return <div>Loading...</div>;
    if (!role) return <div>Not found</div>;

    const {id: orgId, name} = role;

    // Config for role info card
    const roleInfoConfig: CardConfig[] = [
        {
            title: 'Role Info',
            description: 'Below are the role details',
            icon: <Globe />,
            actions: [],
            colSpan: 1,
            children: (
                <div>
                    <p>{orgId}</p>
                </div>
            ),
        },
        {
            title: 'Edit',
            description: 'Edit this role',
            icon: <MapPin />,
            colSpan: 1,
            actions: [
                {
                    text: 'Edit',
                    link: `/roles/${orgId}/edit`,
                },
            ],
        },
        {
            title: 'Permissions',
            description: 'Permissions assigned to the role',
            icon: <DiamondExclamation />,
            colSpan: 1,
            actions: [],
            children: (
                <div className={cn.permissions}>
                    {role.permissions.map((permission) => (
                        <span className={cn.permission} key={permission}>
                            {permission}
                        </span>
                    ))}
                </div>
            ),
        },
        {
            title: 'JSON',
            description: 'Show entire role data in JSON format',
            icon: <Display />,
            actions: [
                {
                    text: showJson ? 'Hide JSON' : 'Show JSON',
                    onClick: () => {
                        setShowJson(!showJson);
                    },
                    view: 'outlined',
                },
            ],
            children: showJson ? <pre>{JSON.stringify(role, null, 2)}</pre> : null,
            colSpan: 3,
        },
    ];

    return (
        <div className={cn.container}>
            <div className={cn.headerRow}>
                <h1>{name}</h1>
            </div>
            <div className={cn.cardsContainer}>
                {roleInfoConfig.map((cfg, idx) => (
                    <CardTemplate key={idx} {...cfg} />
                ))}
            </div>
        </div>
    );
};
