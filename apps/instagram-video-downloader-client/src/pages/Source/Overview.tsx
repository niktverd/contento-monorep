import React, {useCallback, useContext, useEffect, useState} from 'react';

import {ArrowLeft, Code, Filmstrip, Magnifier, Person, Video} from '@gravity-ui/icons';
import {
    Button,
    Icon,
    Select,
    Spin,
    Tab,
    TabList,
    TabPanel,
    TabProvider,
    Text,
    useToaster,
} from '@gravity-ui/uikit';
import {useNavigate, useParams} from 'react-router-dom';

import {CardConfig, CardTemplate} from '../../components/CardTemplate/CardTemplate';
import {AppEnvContext} from '../../contexts/AppEnv';
import {GetOneSourceResponse, IAccount, IScenario, ISource} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {FetchRoutes2} from '../../utils/constants';
import {fetchGet, fetchPost} from '../../utils/fetchHelpers';

import cn from '../Account/Accounts.module.css';

export const Overview = () => {
    const {id} = useParams<{id: string}>();
    const navigate = useNavigate();
    const [source, setSource] = useState<ISource | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {isProd} = useContext(AppEnvContext);
    const [activeSourceTab, setActiveSourceTab] = useState<string>('');
    const [jsonExpanded, setJsonExpanded] = useState(false);
    const {add} = useToaster();
    const [allAccounts, setAllAccounts] = useState<{id: number; slug: string}[]>([]);
    const [allScenarios, setAllScenarios] = useState<{id: number; slug: string}[]>([]);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
    const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
    const [scheduling, setScheduling] = useState(false);

    const fetchSourceDetails = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetchGet<GetOneSourceResponse>({
                route: fetchRoutes.sources.get,
                query: {id},
                isProd,
            });
            setSource(response || null);
            if (response.sources && Object.keys(response.sources).length > 0) {
                setActiveSourceTab(Object.keys(response.sources)[0]);
            }
        } catch (err) {
            setError(err.message || 'Failed to load source details');
        } finally {
            setLoading(false);
        }
    }, [id, isProd]);

    useEffect(() => {
        fetchSourceDetails();
    }, [fetchSourceDetails]);

    useEffect(() => {
        (async () => {
            try {
                const accounts = await fetchGet({
                    route: fetchRoutes.accounts.list,
                    query: {},
                    isProd,
                });
                setAllAccounts(
                    ((accounts || []) as IAccount[]).map((a) => ({id: a.id, slug: a.slug})),
                );
            } catch {}
            try {
                const scenarios = await fetchGet({
                    route: fetchRoutes.scenarios.list,
                    query: {},
                    isProd,
                });
                setAllScenarios(
                    ((scenarios || []) as IScenario[]).map((s) => ({id: s.id, slug: s.slug})),
                );
            } catch {}
        })();
    }, [isProd]);

    const handleBack = () => {
        navigate('/sources');
    };

    const toggleJsonExpanded = () => {
        setJsonExpanded(!jsonExpanded);
    };

    const handleSchedule = async () => {
        if (!source?.id || !selectedAccountIds.length || !selectedScenarioIds.length) {
            add({
                name: 'schedule-missing',
                title: 'Select at least one account and scenario',
                theme: 'danger',
            });
            return;
        }
        setScheduling(true);
        try {
            const res = await fetchPost({
                route: FetchRoutes2.scheduleSourceVideoCreation,
                body: {
                    sourceIds: [source.id],
                    accountIds: selectedAccountIds.map(Number),
                    scenarioIds: selectedScenarioIds.map(Number),
                },
                isProd,
            });
            add({
                name: 'schedule-success',
                title: res?.message || 'Scheduled successfully',
                theme: 'success',
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            add({
                name: 'schedule-fail',
                title: err?.message || 'Failed to schedule',
                theme: 'danger',
            });
        } finally {
            setScheduling(false);
        }
    };

    if (loading) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', padding: '40px'}}>
                <Spin size="l" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
                <Button
                    view="flat"
                    onClick={handleBack}
                    leftContent={<Icon data={ArrowLeft} />}
                    style={{marginBottom: '20px'}}
                >
                    Back to Sources
                </Button>
                <CardTemplate
                    title="Error"
                    description={error}
                    actions={[{text: 'Retry', onClick: fetchSourceDetails}]}
                />
            </div>
        );
    }

    if (!source) {
        return (
            <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
                <Button
                    view="flat"
                    onClick={handleBack}
                    leftContent={<Icon data={ArrowLeft} />}
                    style={{marginBottom: '20px'}}
                >
                    Back to Sources
                </Button>
                <CardTemplate
                    title="Source not found"
                    description="The requested source could not be found."
                />
            </div>
        );
    }

    const sourceTabs = source.sources
        ? Object.keys(source.sources).map((key) => ({
              id: key,
              title: key,
              content: (
                  <div style={{padding: '12px', borderRadius: '4px', marginTop: '12px'}}>
                      <pre style={{overflowX: 'auto'}}>
                          {JSON.stringify(source.sources[key], null, 2)}
                      </pre>
                  </div>
              ),
          }))
        : [];

    // Card configs
    const cardConfigs: CardConfig[] = [
        {
            title: 'Source Info',
            description: 'General information about this source',
            icon: <Icon data={Person} />,
            colSpan: 1,
            children: (
                <div>
                    <div>
                        <b>ID:</b> {source.id}
                    </div>
                    <div style={{marginTop: 8}}>
                        <b>URL:</b>{' '}
                        <a href={source.firebaseUrl} target="_blank" rel="noopener noreferrer">
                            {source.firebaseUrl}
                        </a>
                    </div>
                    {source.sender && (
                        <div style={{marginTop: 8}}>
                            <b>Sender ID:</b> {source.sender}
                        </div>
                    )}
                    {source.recipient && (
                        <div style={{marginTop: 8}}>
                            <b>Recipient ID:</b> {source.recipient}
                        </div>
                    )}
                    {source.duration !== undefined && (
                        <div style={{marginTop: 8}}>
                            <b>Duration:</b> {source.duration?.toFixed(2)}s
                        </div>
                    )}
                </div>
            ),
        },
        source.firebaseUrl
            ? {
                  title: 'Video Preview',
                  description: 'Preview the video',
                  icon: <Icon data={Video} />,
                  colSpan: 1,
                  children: (
                      <video
                          controls
                          style={{
                              width: '100%',
                              maxHeight: '400px',
                              borderRadius: '8px',
                              marginTop: '8px',
                          }}
                          src={source.firebaseUrl}
                      />
                  ),
              }
            : null,
        source.sources && Object.keys(source.sources).length > 0
            ? {
                  title: 'Sources',
                  description: 'All available sources',
                  icon: <Icon data={Filmstrip} />,
                  colSpan: 1,
                  children: (
                      <TabProvider value={activeSourceTab} onUpdate={setActiveSourceTab}>
                          <TabList>
                              {sourceTabs.map((item) => (
                                  <Tab key={item.id} value={item.id}>
                                      {item.title}
                                  </Tab>
                              ))}
                          </TabList>
                          <div style={{overflowY: 'scroll', maxHeight: '400px'}}>
                              {sourceTabs.map((item) => (
                                  <TabPanel key={item.id} value={item.id}>
                                      {item.content}
                                  </TabPanel>
                              ))}
                          </div>
                      </TabProvider>
                  ),
              }
            : null,
        {
            title: 'Full JSON Data',
            description: 'Show the entire source object as JSON',
            icon: <Icon data={Code} />,
            colSpan: 3,
            actions: [
                {
                    text: jsonExpanded ? 'Hide JSON' : 'Show JSON',
                    onClick: toggleJsonExpanded,
                    view: 'outlined',
                },
            ],
            children: jsonExpanded ? (
                <pre
                    style={{
                        padding: '12px',
                        borderRadius: '4px',
                        overflowX: 'auto',
                        marginTop: '8px',
                        overflowY: 'scroll',
                    }}
                >
                    {JSON.stringify(source, null, 2)}
                </pre>
            ) : null,
        },
        {
            title: 'Schedule New Video Creation',
            description: 'Select accounts and scenarios, then schedule video creation via pubsub',
            icon: <Icon data={Magnifier} />,
            colSpan: 1,
            children: (
                <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                    <div>
                        <b>Accounts:</b>
                        <div style={{minWidth: 220, marginTop: 8}}>
                            <Select
                                multiple
                                filterable
                                placeholder="Select accounts"
                                options={allAccounts.map((a) => ({
                                    value: String(a.id),
                                    content: a.slug,
                                }))}
                                value={selectedAccountIds}
                                onUpdate={(vals) => setSelectedAccountIds(vals as string[])}
                            />
                        </div>
                    </div>
                    <div>
                        <b>Scenarios:</b>
                        <div style={{minWidth: 220, marginTop: 8}}>
                            <Select
                                multiple
                                filterable
                                placeholder="Select scenarios"
                                options={allScenarios.map((s) => ({
                                    value: String(s.id),
                                    content: s.slug,
                                }))}
                                value={selectedScenarioIds}
                                onUpdate={(vals) => setSelectedScenarioIds(vals as string[])}
                            />
                        </div>
                    </div>
                    <Button
                        view="action"
                        size="l"
                        loading={scheduling}
                        onClick={handleSchedule}
                        disabled={scheduling}
                    >
                        Schedule
                    </Button>
                </div>
            ),
        },
        {
            title: 'Actions',
            description: 'Refresh the data',
            icon: <Icon data={Magnifier} />,
            colSpan: 1,
            actions: [
                {
                    text: 'Refresh',
                    onClick: fetchSourceDetails,
                },
            ],
        },
        {
            title: 'Prepared Videos',
            description: 'Click to view prepared videos with the source',
            icon: <Icon data={Magnifier} />,
            colSpan: 1,
            actions: [
                {
                    text: 'Go to Prepared Videos',
                    link: `/prepared-videos?sourceIds=${source.id}`,
                },
            ],
        },
    ].filter(Boolean) as CardConfig[];

    return (
        <div className={cn.container}>
            <div className={cn.headerRow}>
                <Button view="flat" onClick={handleBack} leftContent={<Icon data={ArrowLeft} />}>
                    Back to Sources
                </Button>
                <Text variant="header-1">{source.id}</Text>
            </div>
            <div className={cn.cardsContainer}>
                {cardConfigs.map((cfg, idx) => (
                    <CardTemplate key={idx} {...cfg} />
                ))}
            </div>
        </div>
    );
};
