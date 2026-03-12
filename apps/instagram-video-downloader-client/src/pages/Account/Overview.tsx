import React, {useContext, useEffect, useState} from 'react';

import {
    Binoculars,
    ChartAreaStackedNormalized,
    Display,
    Filmstrip,
    Globe,
    MapPin,
    Pin,
} from '@gravity-ui/icons';
import {useParams} from 'react-router-dom';
import {z} from 'zod';

import {InsightsChart} from '../../components/Account/InsightsChart';
import {InstagramConnect} from '../../components/Account/InstagramConnect';
import {CardConfig, CardTemplate} from '../../components/CardTemplate/CardTemplate';
import {AppEnvContext} from '../../contexts/AppEnv';
import {IAccount, IScenario} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {UiGetInsightsResponseSchema} from '../../sharedTypes/schemas/handlers/instagramAPI';
import {FetchRoutes2} from '../../utils/constants';
import {fetchGet} from '../../utils/fetchHelpers';

import cn from '../../components/Account/Account.module.css';

type UiGetInsightsResponse = z.infer<typeof UiGetInsightsResponseSchema>;

export const Overview = () => {
    const {id} = useParams();
    const {isProd} = useContext(AppEnvContext);
    const [account, setAccount] = useState<IAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [showJson, setShowJson] = useState(false);
    const [insights, setInsights] = useState<UiGetInsightsResponse>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchGet<IAccount>({
            route: fetchRoutes.accounts.get,
            query: {id},
            isProd,
        })
            .then(setAccount)
            .finally(() => setLoading(false));
    }, [id, isProd]);

    const handleGetInsights = async () => {
        const insightsLocal = await fetchGet<UiGetInsightsResponse>({
            route: FetchRoutes2.getInsights,
            query: {id: account?.id},
            isProd,
        });

        setInsights(insightsLocal);
    };

    if (loading) return <div>Loading...</div>;
    if (!account) return <div>Not found</div>;

    const {
        token,
        id: accId,
        availableScenarios = [],
        instagramLocations = [],
        slug,
        token: instagramToken,
        userIdIG,
    } = account;

    // Config for account info card
    const accountInfoConfig: CardConfig[] = [
        {
            title: 'Account Info',
            description: 'Below are the account details',
            icon: <Globe />,
            actions: [],
            colSpan: 1,
            children: (
                <div>
                    <p>{accId}</p>
                    {token && <p className={cn.token}>Token: {token.slice(0, 3)}****</p>}
                    {userIdIG && <p className={cn.token}>IG User ID: {userIdIG}</p>}
                </div>
            ),
        },
        {
            title: 'Edit',
            description: 'Edit this account',
            icon: <MapPin />,
            colSpan: 1,
            actions: [
                {
                    text: 'Edit',
                    link: `/account/${accId}/edit`,
                },
            ],
        },
        {
            title: 'Get Insights',
            description: 'Fetch account insights',
            icon: <ChartAreaStackedNormalized />,
            actions: [
                {
                    text: 'Get Insights',
                    onClick: handleGetInsights,
                },
            ],
            children:
                insights && insights.data && Array.isArray(insights.data)
                    ? insights.data.map((item, idx) => (
                          <InsightsChart
                              key={item.name + idx}
                              title={item.name}
                              data={
                                  Array.isArray(item.values)
                                      ? item.values.map((v) => ({
                                            value: typeof v.value === 'number' ? v.value : 0,
                                            end_time:
                                                typeof v.end_time === 'string' ? v.end_time : '',
                                        }))
                                      : []
                              }
                          />
                      ))
                    : null,
            colSpan: 1,
        },
        {
            title: 'Scenarios',
            description:
                'Below are the scenarios connected to this account. You can see the details of each scenario by clicking on the scenario name.',
            icon: <Filmstrip />,
            actions:
                availableScenarios?.map((scenario: IScenario) => ({
                    text: `See: ${scenario.slug}`,
                    link: `/scenario/${scenario.id}`,
                })) || [],
            colSpan: 1,
        },
        {
            title: 'Instagram Locations',
            description: 'Locations linked to this account',
            icon: <Pin />,
            actions:
                instagramLocations?.map((location) => ({
                    text: `${location.name || location.externalId || location.id}`,
                    link: `/instagram-location/${location.id}`,
                })) || [],
            colSpan: 1,
        },
        {
            title: 'Prepared Videos',
            description: 'Click the Button to see all prepared videos',
            icon: <Binoculars />,
            actions: [
                {
                    text: `Go to Prepared Videos`,
                    link: `/prepared-videos/?accountIds=${accId}`,
                },
            ],
            colSpan: 1,
        },
        {
            title: 'JSON',
            description: 'Show entire account data in JSON format',
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
            children: showJson ? <pre>{JSON.stringify(account, null, 2)}</pre> : null,
            colSpan: 3,
        },
    ];

    return (
        <div className={cn.container}>
            <div className={cn.headerRow}>
                <h1>{slug}</h1>
                <InstagramConnect accountId={String(accId)} token={instagramToken} slug={slug} />
            </div>
            <div className={cn.cardsContainer}>
                {accountInfoConfig.map((cfg, idx) => (
                    <CardTemplate key={idx} {...cfg} />
                ))}
            </div>
        </div>
    );
};
