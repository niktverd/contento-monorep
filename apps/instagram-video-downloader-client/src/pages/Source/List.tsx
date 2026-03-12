import React, {useCallback, useContext, useEffect, useState} from 'react';

import {
    Button,
    Checkbox,
    Pagination,
    Select,
    Table,
    TableColumnConfig,
    TableDataItem,
    useToaster,
    withTableActions,
    withTableSelection,
    withTableSorting,
} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllSourcesResponse, IAccount, IScenario, ISource} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {FetchRoutes2} from '../../utils/constants';
import {fetchGet, fetchPost} from '../../utils/fetchHelpers';

const EnhancedTable = withTableSelection(withTableSorting(withTableActions(Table)));

export const List = () => {
    const navigate = useNavigate();
    const [sources, setSources] = useState<ISource[]>([]);
    const [_loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [sortOrder, setSortOrder] = useState({
        columnId: 'updatedAt',
        order: 'desc' as 'asc' | 'desc',
    });
    const [notInPreparedVideos, setNotInPreparedVideos] = useState(false);
    const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
    const [allAccounts, setAllAccounts] = useState<{id: number; slug: string}[]>([]);
    const [allScenarios, setAllScenarios] = useState<{id: number; slug: string}[]>([]);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
    const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
    const [scheduling, setScheduling] = useState(false);
    const {isProd} = useContext(AppEnvContext);
    const {add} = useToaster();

    const loadSources = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const query: {
                page: number;
                limit: number;
                sortBy: string;
                sortOrder: string;
                notInThePreparedVideos?: boolean;
            } = {
                page,
                limit: pageSize,
                sortBy: sortOrder.columnId,
                sortOrder: sortOrder.order,
            };

            if (notInPreparedVideos) {
                query.notInThePreparedVideos = true;
            }

            const response = await fetchGet<GetAllSourcesResponse>({
                route: fetchRoutes.sources.list,
                query,
                isProd,
            });

            setSources(response.sources || []);
            setTotalItems(response.count || 0);
        } catch (err) {
            setError(err.message || 'Failed to load sources');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sortOrder, notInPreparedVideos, isProd]);

    useEffect(() => {
        loadSources();
    }, [loadSources]);

    useEffect(() => {
        (async () => {
            try {
                const accounts = await fetchGet<IAccount[]>({
                    route: fetchRoutes.accounts.list,
                    query: {onlyEnabled: true},
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

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handlePageSizeChange = ([value]: string[]) => {
        setPageSize(Number(value));
        setPage(1);
    };

    const handleSortChange = (sort: {column: string; order: 'asc' | 'desc'}) => {
        setSortOrder({
            columnId: sort.column,
            order: sort.order,
        });
    };

    const handleScheduleBulk = async () => {
        if (
            !selectedSourceIds.length ||
            !selectedAccountIds.length ||
            !selectedScenarioIds.length
        ) {
            add({
                name: 'schedule-missing',
                title: 'Select at least one source, account, and scenario',
                theme: 'danger',
            });
            return;
        }
        setScheduling(true);
        try {
            await fetchPost({
                route: FetchRoutes2.scheduleSourceVideoCreation,
                body: {
                    sourceIds: selectedSourceIds.map(Number),
                    accountIds: selectedAccountIds.map(Number),
                    scenarioIds: selectedScenarioIds.map(Number),
                },
                isProd,
            });
            add({
                name: 'schedule-success',
                title: 'Bulk scheduling completed successfully',
                theme: 'success',
            });
            setSelectedSourceIds([]);
            setSelectedAccountIds([]);
            setSelectedScenarioIds([]);
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

    const columns: TableColumnConfig<TableDataItem>[] = [
        {
            id: 'id',
            name: 'id',
        },
        {
            id: 'firebaseUrl',
            name: 'URL',
            template: (item: ISource) => (
                <a href={item.firebaseUrl} target="_blank" rel="noopener noreferrer">
                    watch
                </a>
            ),
        },
        {
            id: 'type',
            name: 'Type',
        },
        {
            id: 'updatedAt',
            name: 'Updated At',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            template: (item: any) => new Date(item.updatedAt).toLocaleString(),
        },
        {
            id: 'actions',
            name: 'Actions',
            template: () => null,
        },
    ];

    return (
        <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}
            >
                <h2>Sources</h2>
                <Button view="action" onClick={loadSources}>
                    Refresh
                </Button>
                <Button view="action" href={`/sources/statistics`}>
                    Statistics
                </Button>
            </div>

            <div style={{marginBottom: '20px'}}>
                <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                    <Select
                        label="Page size:"
                        value={[pageSize.toString()]}
                        onUpdate={handlePageSizeChange}
                        filterable={false}
                    >
                        <Select.Option value="1">1</Select.Option>
                        <Select.Option value="5">5</Select.Option>
                        <Select.Option value="10">10</Select.Option>
                        <Select.Option value="25">25</Select.Option>
                        <Select.Option value="50">50</Select.Option>
                    </Select>

                    <Checkbox
                        checked={notInPreparedVideos}
                        onUpdate={setNotInPreparedVideos}
                        content="Not in prepared videos"
                    />
                </div>
            </div>

            {error && (
                <div
                    style={{
                        padding: '12px',
                        background: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        marginBottom: '20px',
                    }}
                >
                    {error}
                </div>
            )}

            {selectedSourceIds.length > 0 && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '20px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                    }}
                >
                    <h3 style={{marginTop: 0, marginBottom: '16px'}}>
                        Bulk Schedule Video Creation ({selectedSourceIds.length} sources selected)
                    </h3>
                    <div
                        style={{display: 'flex', gap: '20px', alignItems: 'end', flexWrap: 'wrap'}}
                    >
                        <div style={{minWidth: '220px'}}>
                            <label
                                style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}
                            >
                                Accounts:
                            </label>
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
                        <div style={{minWidth: '220px'}}>
                            <label
                                style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}
                            >
                                Scenarios:
                            </label>
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
                        <Button
                            view="action"
                            size="l"
                            loading={scheduling}
                            onClick={handleScheduleBulk}
                            disabled={
                                scheduling ||
                                !selectedAccountIds.length ||
                                !selectedScenarioIds.length
                            }
                        >
                            Schedule All
                        </Button>
                        <Button
                            view="outlined"
                            onClick={() => setSelectedSourceIds([])}
                            disabled={scheduling}
                        >
                            Clear Selection
                        </Button>
                    </div>
                </div>
            )}

            <EnhancedTable
                data={sources}
                columns={columns}
                getRowId={(item) => item.id}
                sortState={[{column: sortOrder.columnId, order: sortOrder.order}]}
                onSortStateChange={(sort) => handleSortChange(sort[0])}
                emptyMessage="No sources found"
                onSelectionChange={(ids) => setSelectedSourceIds(ids)}
                selectedIds={selectedSourceIds}
                onRowClick={(row) => {
                    navigate(`/sources/${row.id}`);
                }}
            />

            <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center'}}>
                <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={totalItems}
                    onUpdate={handlePageChange}
                />
            </div>
        </div>
    );
};
