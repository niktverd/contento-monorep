import React, {useContext, useEffect, useState} from 'react';

import {Display, Globe, Hashtag, MapPin} from '@gravity-ui/icons';
import {useParams} from 'react-router-dom';

import {CardConfig, CardTemplate} from '../../components/CardTemplate/CardTemplate';
import {AppEnvContext} from '../../contexts/AppEnv';
import {
    GetSecretForInstagramLinkingResponse,
    IOrganization,
    IOrganizationSender,
} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from './Organization.module.css';

export const Overview = () => {
    const {id} = useParams();
    const {isProd} = useContext(AppEnvContext);
    const [organization, setOrganization] = useState<IOrganization | null>(null);
    const [loading, setLoading] = useState(true);
    const [showJson, setShowJson] = useState(false);
    const [secret, setSecret] = useState<string | null>(null);
    const [organizationSenders, setOrganizationSenders] = useState<IOrganizationSender[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchGet<IOrganization>({
            route: fetchRoutes.organizations.get,
            query: {id},
            isProd,
        })
            .then(setOrganization)
            .finally(() => setLoading(false));
    }, [id, isProd]);

    useEffect(() => {
        if (!organization) return;
        fetchGet<IOrganizationSender[]>({
            route: fetchRoutes.organizationSenders.list,
            query: {organizationId: organization.id},
            isProd,
        })
            .then(setOrganizationSenders)
            .finally(() => setLoading(false));
    }, [organization, isProd]);

    if (loading) return <div>Loading...</div>;
    if (!organization) return <div>Not found</div>;

    const {id: orgId, name} = organization;

    // Config for organization info card
    const organizationInfoConfig: CardConfig[] = [
        {
            title: 'Organization Info',
            description: 'Below are the organization details',
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
            description: 'Edit this organization',
            icon: <MapPin />,
            colSpan: 1,
            actions: [
                {
                    text: 'Edit',
                    link: `/organizations/${orgId}/edit`,
                },
            ],
        },
        {
            title: 'Users',
            description: 'Edit users',
            icon: <MapPin />,
            colSpan: 1,
            actions: [
                {
                    text: 'Edit',
                    link: `/organizations/${orgId}/users`,
                },
            ],
        },
        {
            title: 'Get Secret',
            description: 'Get secret to send in instagram messages',
            icon: <Hashtag />,
            colSpan: 1,
            actions: [
                {
                    text: 'Get secret',
                    onClick: async () => {
                        const secretvalue = await fetchGet<GetSecretForInstagramLinkingResponse>({
                            route: fetchRoutes.organizations.getSecretForInstagramLinking,
                            query: {organizationId: orgId},
                            isProd,
                        });

                        setSecret(secretvalue?.secret ?? null);
                    },
                },
            ],
            children: <pre className={cn.secret}>{secret ?? 'No secret'}</pre>,
        },
        {
            title: 'Senders',
            description: 'Senders',
            icon: <MapPin />,
            colSpan: 1,
            children: (
                <pre className={cn.secret}>{JSON.stringify(organizationSenders, null, 2)}</pre>
            ),
        },
        {
            title: 'JSON',
            description: 'Show entire organization data in JSON format',
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
            children: showJson ? <pre>{JSON.stringify(organization, null, 2)}</pre> : null,
            colSpan: 3,
        },
    ];

    return (
        <div className={cn.container}>
            <div className={cn.headerRow}>
                <h1>{name}</h1>
            </div>
            <div className={cn.cardsContainer}>
                {organizationInfoConfig.map((cfg, idx) => (
                    <CardTemplate key={idx} {...cfg} />
                ))}
            </div>
        </div>
    );
};
