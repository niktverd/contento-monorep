/* eslint-disable no-nested-ternary */
import React, {useCallback, useContext, useEffect, useState} from 'react';

import {useParams} from 'react-router-dom';

import {CardConfig, CardTemplate} from '../../components/CardTemplate/CardTemplate';
import {AppEnvContext} from '../../contexts/AppEnv';
import {GetInstagramMediaContainerByIdResponse, IInstagramMediaContainer} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from '../Scenario/Scenarios.module.css';

const Overview: React.FC = () => {
    const {id} = useParams<{id: string}>();
    const [container, setContainer] = useState<IInstagramMediaContainer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const {isProd} = useContext(AppEnvContext);

    const loadContainer = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchGet<GetInstagramMediaContainerByIdResponse>({
                route: fetchRoutes.instagramMediaContainers.get,
                query: {id: Number(id)},
                isProd,
            });
            setContainer(data);
        } catch {
            setError('Failed to load media container');
        } finally {
            setLoading(false);
        }
    }, [id, isProd]);

    useEffect(() => {
        if (id) loadContainer();
    }, [id, loadContainer]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!container) return <div>Not found</div>;

    const config: CardConfig[] = [
        {
            title: 'Instagram Media Container',
            description: 'Детали контейнера Instagram Media',
            colSpan: 2 as const,
            actions: [
                {
                    text: 'Open prepared video',
                    link: `/prepared-videos/${container.preparedVideoId}`,
                },
            ],
            children: (
                <dl
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'max-content 1fr',
                        rowGap: 12,
                        columnGap: 24,
                    }}
                >
                    <dt>ID</dt>
                    <dd>{container.id}</dd>
                    <dt>Created At</dt>
                    <dd>
                        {container.createdAt ? new Date(container.createdAt).toLocaleString() : '-'}
                    </dd>
                    <dt>Updated At</dt>
                    <dd>
                        {container.updatedAt ? new Date(container.updatedAt).toLocaleString() : '-'}
                    </dd>
                    <dt>Prepared Video ID</dt>
                    <dd>{container.preparedVideoId}</dd>
                    <dt>Account ID</dt>
                    <dd>{container.accountId}</dd>
                    <dt>Last Checked IG Status</dt>
                    <dd>{container.lastCheckedIGStatus || '-'}</dd>
                    <dt>Is Published</dt>
                    <dd>
                        {container.isPublished === undefined
                            ? '-'
                            : container.isPublished
                              ? 'Yes'
                              : 'No'}
                    </dd>
                    <dt>Attempts</dt>
                    <dd>{container.attempts ?? '-'}</dd>
                    <dt>Error</dt>
                    <dd>{container.error || '-'}</dd>
                    <dt>Container ID</dt>
                    <dd>{container.containerId || '-'}</dd>
                    <dt>Media ID</dt>
                    <dd>{container.mediaId || '-'}</dd>
                    <dt>Caption</dt>
                    <dd>{container.caption || '-'}</dd>
                    <dt>Audio Name</dt>
                    <dd>{container.audioName || '-'}</dd>
                    <dt>Location</dt>
                    <dd>{container.location ? JSON.stringify(container.location) : '-'}</dd>
                    <dt>Hashtags</dt>
                    <dd>{container.hashtags ? container.hashtags.join(', ') : '-'}</dd>
                    <dt>Is Blocked</dt>
                    <dd>
                        {container.isBlocked === undefined
                            ? '-'
                            : container.isBlocked
                              ? 'Yes'
                              : 'No'}
                    </dd>
                    <dt>Blocked Reason</dt>
                    <dd>{container.blockedReason || '-'}</dd>
                </dl>
            ),
        },
    ];

    return (
        <div className={cn.container}>
            <div className={cn.cardsContainer}>
                {config.map((cfg) => (
                    <CardTemplate key={cfg.title} {...cfg} />
                ))}
            </div>
        </div>
    );
};

export default Overview;
