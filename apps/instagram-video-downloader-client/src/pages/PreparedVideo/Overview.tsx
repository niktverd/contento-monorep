import React, {memo, useCallback, useContext, useEffect, useState} from 'react';

import {useParams} from 'react-router-dom';

import {CardConfig, CardTemplate} from '../../components/CardTemplate/CardTemplate';
import {AppEnvContext} from '../../contexts/AppEnv';
import {
    FindPreparedVideoDuplicatesParams,
    FindPreparedVideoDuplicatesResponse,
    GetPreparedVideoByIdResponse,
    IPreparedVideo,
} from '../../sharedTypes/schemas';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from '../Scenario/Scenarios.module.css';

const DuplicatesTable: React.FC<{
    duplicates: IPreparedVideo[] | null;
    loading: boolean;
    error: string | null;
    currentId: number | string;
}> = memo(({duplicates, loading, error, currentId}) => {
    if (loading) {
        return <div>Загрузка дубликатов...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>{error}</div>;
    }
    if (duplicates && duplicates.length > 0) {
        return (
            <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Duration</th>
                            <th>Scenario ID</th>
                            <th>Source ID</th>
                            <th>Account ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {duplicates.map((dup) => (
                            <tr
                                key={dup.id}
                                style={{
                                    background: dup.id === currentId ? '#12121272' : undefined,
                                }}
                            >
                                <td>{dup.id}</td>
                                <td>{dup.duration ?? '-'}</td>
                                <td>{dup.scenarioId}</td>
                                <td>{dup.sourceId}</td>
                                <td>{dup.accountId}</td>
                                <td>
                                    <a href={`/prepared-videos/${dup.id}`}>{dup.id}</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    return <div>Дубликаты не найдены</div>;
});
DuplicatesTable.displayName = 'DuplicatesTable';

const Overview: React.FC = () => {
    const {id} = useParams<{id: string}>();
    const [video, setVideo] = useState<IPreparedVideo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [duplicates, setDuplicates] = useState<IPreparedVideo[] | null>(null);
    const [duplicatesLoading, setDuplicatesLoading] = useState(false);
    const [duplicatesError, setDuplicatesError] = useState<string | null>(null);
    const {isProd} = useContext(AppEnvContext);

    const loadVideo = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchGet<GetPreparedVideoByIdResponse>({
                route: fetchRoutes.preparedVideos.get,
                query: {id: Number(id)},
                isProd,
            });
            setVideo(data);
        } catch {
            setError('Failed to load prepared video');
        } finally {
            setLoading(false);
        }
    }, [id, isProd]);

    // Загрузка дубликатов
    const loadDuplicates = useCallback(
        async (videoLocal: IPreparedVideo) => {
            setDuplicatesLoading(true);
            setDuplicatesError(null);
            try {
                const params: FindPreparedVideoDuplicatesParams = {
                    accountId: videoLocal.accountId,
                    sourceId: videoLocal.sourceId,
                    scenarioId: videoLocal.scenarioId,
                };
                const data = await fetchGet<FindPreparedVideoDuplicatesResponse>({
                    route: fetchRoutes.preparedVideos.duplicates,
                    query: params,
                    isProd,
                });
                setDuplicates((data ?? []) as FindPreparedVideoDuplicatesResponse);
            } catch {
                setDuplicatesError('Failed to load duplicates');
            } finally {
                setDuplicatesLoading(false);
            }
        },
        [isProd],
    );

    useEffect(() => {
        if (id) loadVideo();
    }, [id, loadVideo]);

    useEffect(() => {
        if (video) {
            loadDuplicates(video);
        }
    }, [video, loadDuplicates]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!video) return <div>Not found</div>;

    const config: CardConfig[] = [
        {
            title: 'Prepared Video',
            description: 'Детали подготовленного видео',
            colSpan: 2 as const,
            actions: [
                video.scenarioId && {
                    text: 'Go to Scenario',
                    link: `/scenario/${video.scenarioId}`,
                },
                video.sourceId && {
                    text: 'Go to Source',
                    link: `/source/${video.sourceId}`,
                },
                video.accountId && {
                    text: 'Go to Account',
                    link: `/account/${video.accountId}`,
                },
            ].filter(Boolean),
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
                    <dd>{video.id}</dd>
                    <dt>Firebase URL</dt>
                    <dd>{video.firebaseUrl}</dd>
                    <dt>Duration</dt>
                    <dd>{video.duration ?? '-'}</dd>
                    <dt>Scenario ID</dt>
                    <dd>{video.scenarioId}</dd>
                    <dt>Source ID</dt>
                    <dd>{video.sourceId}</dd>
                    <dt>Account ID</dt>
                    <dd>{video.accountId}</dd>
                    <dt>Scenario (object)</dt>
                    <dd>
                        {video.scenario ? (
                            <pre style={{margin: 0}}>{JSON.stringify(video.scenario, null, 2)}</pre>
                        ) : (
                            '-'
                        )}
                    </dd>
                    <dt>Source (object)</dt>
                    <dd>
                        {video.source ? (
                            <pre style={{margin: 0}}>{JSON.stringify(video.source, null, 2)}</pre>
                        ) : (
                            '-'
                        )}
                    </dd>
                    <dt>Account (object)</dt>
                    <dd>
                        {video.account ? (
                            <pre style={{margin: 0}}>{JSON.stringify(video.account, null, 2)}</pre>
                        ) : (
                            '-'
                        )}
                    </dd>
                </dl>
            ),
        },
        {
            title: 'Preview',
            description: 'Предпросмотр видео',
            colSpan: 1,
            children: video.firebaseUrl ? (
                <video
                    src={video.firebaseUrl}
                    controls
                    style={{width: '100%', maxWidth: 480, borderRadius: 8, background: '#000'}}
                >
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div>No video available</div>
            ),
        },
        {
            title: 'Дубликаты',
            description: 'Все найденные дубликаты по accountId, sourceId, scenarioId',
            colSpan: 3 as const,
            children: (
                <DuplicatesTable
                    duplicates={duplicates}
                    loading={duplicatesLoading}
                    error={duplicatesError}
                    currentId={video.id}
                />
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
