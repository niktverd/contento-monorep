import React, {useCallback, useContext, useEffect, useState} from 'react';

import {
    Button,
    Pagination,
    Select,
    Table,
    TableColumnConfig,
    TableDataItem,
    withTableActions,
    withTableSelection,
    withTableSorting,
} from '@gravity-ui/uikit';
import {useLocation, useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllPreparedVideosResponse, IPreparedVideo} from '../../sharedTypes/schemas';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

const EnhancedTable = withTableSelection(withTableSorting(withTableActions(Table)));

const List: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [preparedVideos, setPreparedVideos] = useState<IPreparedVideo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [sortOrder, setSortOrder] = useState({
        columnId: 'id',
        order: 'desc' as 'asc' | 'desc',
    });
    const {isProd} = useContext(AppEnvContext);
    const [findDuplicates, setFindDuplicates] = useState(false);

    // Parse query params for filters
    const searchParams = new URLSearchParams(location.search);
    const accountIds = searchParams.getAll('accountIds');
    const scenarioIds = searchParams.getAll('scenarioIds');
    const sourceIds = searchParams.getAll('sourceIds');
    const findDuplicatesParam = searchParams.get('findDuplicates');

    const loadPreparedVideos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const query: Record<string, string | number | boolean | string[]> = {
                page,
                limit: pageSize,
                sortBy: sortOrder.columnId,
                sortOrder: sortOrder.order,
            };
            if (accountIds.length) {
                query.accountIds = accountIds;
            }
            if (scenarioIds.length) {
                query.scenarioIds = scenarioIds;
            }
            if (sourceIds.length) {
                query.sourceIds = sourceIds;
            }
            if (findDuplicates) {
                query.findDuplicates = true;
            }
            const response = await fetchGet<GetAllPreparedVideosResponse>({
                route: fetchRoutes.preparedVideos.list,
                query,
                isProd,
            });
            setPreparedVideos(response.preparedVideos || []);
            setTotalItems(response.count || 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || 'Failed to load prepared videos');
        } finally {
            setLoading(false);
        }
    }, [
        page,
        pageSize,
        sortOrder.columnId,
        sortOrder.order,
        accountIds,
        scenarioIds,
        sourceIds,
        isProd,
        findDuplicates,
    ]);

    useEffect(() => {
        loadPreparedVideos();
        if (findDuplicatesParam === 'true') {
            setFindDuplicates(true);
        } else {
            setFindDuplicates(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, findDuplicates]);

    const handlePageChange = (newPage: number) => setPage(newPage);
    const handlePageSizeChange = ([value]: string[]) => {
        setPageSize(Number(value));
        setPage(1);
    };
    const handleSortChange = (sort: {column: string; order: 'asc' | 'desc'}) => {
        setSortOrder({columnId: sort.column, order: sort.order});
    };

    const columns: TableColumnConfig<TableDataItem>[] = [
        {id: 'id', name: 'id'},
        {
            id: 'firebaseUrl',
            name: 'URL',
            template: (item: IPreparedVideo) => (
                <a href={item.firebaseUrl} target="_blank" rel="noopener noreferrer">
                    watch
                </a>
            ),
        },
        {
            id: 'duration',
            name: 'Duration',
            template: (item: IPreparedVideo) => (item.duration ? `${item.duration}s` : '-'),
        },
        {id: 'scenarioId', name: 'Scenario ID'},
        {id: 'sourceId', name: 'Source ID'},
        {id: 'accountId', name: 'Account ID'},
        {
            id: 'actions',
            name: 'Actions',
            template: () => null,
        },
    ];

    return (
        <div style={{padding: 20, maxWidth: 1200, margin: '0 auto'}}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                }}
            >
                <h2>Prepared Videos</h2>
                <div style={{display: 'flex', gap: 8}}>
                    <Button view="action" onClick={loadPreparedVideos} loading={loading}>
                        Refresh
                    </Button>
                    <Button view="action" href="/prepared-videos/statistics">
                        Statistics
                    </Button>
                </div>
            </div>
            <div style={{marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16}}>
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
                <label style={{display: 'flex', alignItems: 'center', gap: 4}}>
                    <input
                        type="checkbox"
                        checked={findDuplicates}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setFindDuplicates(checked);
                            const newParams = new URLSearchParams(location.search);
                            if (checked) {
                                newParams.set('findDuplicates', 'true');
                            } else {
                                newParams.delete('findDuplicates');
                            }
                            navigate({
                                pathname: location.pathname,
                                search: newParams.toString(),
                            });
                        }}
                    />
                    <span>Show only duplicates</span>
                </label>
            </div>
            {error && (
                <div
                    style={{
                        padding: 12,
                        background: '#ffebee',
                        color: '#c62828',
                        borderRadius: 4,
                        marginBottom: 20,
                    }}
                >
                    {error}
                </div>
            )}
            {/* Active filters as buttons */}
            {(accountIds.length || scenarioIds.length || sourceIds.length) && (
                <div style={{marginBottom: 16, display: 'flex', gap: 8}}>
                    {accountIds.map((id) => (
                        <Button
                            key={`accountIds-${id}`}
                            size="s"
                            view="outlined"
                            onClick={() => {
                                const newParams = new URLSearchParams(location.search);
                                const all = newParams.getAll('accountIds').filter((v) => v !== id);
                                newParams.delete('accountIds');
                                all.forEach((v) => newParams.append('accountIds', v));
                                navigate({
                                    pathname: location.pathname,
                                    search: newParams.toString(),
                                });
                            }}
                        >
                            accountId: {id} ✕
                        </Button>
                    ))}
                    {scenarioIds.map((id) => (
                        <Button
                            key={`scenarioIds-${id}`}
                            size="s"
                            view="outlined"
                            onClick={() => {
                                const newParams = new URLSearchParams(location.search);
                                const all = newParams.getAll('scenarioIds').filter((v) => v !== id);
                                newParams.delete('scenarioIds');
                                all.forEach((v) => newParams.append('scenarioIds', v));
                                navigate({
                                    pathname: location.pathname,
                                    search: newParams.toString(),
                                });
                            }}
                        >
                            scenarioId: {id} ✕
                        </Button>
                    ))}
                    {sourceIds.map((id) => (
                        <Button
                            key={`sourceIds-${id}`}
                            size="s"
                            view="outlined"
                            onClick={() => {
                                const newParams = new URLSearchParams(location.search);
                                const all = newParams.getAll('sourceIds').filter((v) => v !== id);
                                newParams.delete('sourceIds');
                                all.forEach((v) => newParams.append('sourceIds', v));
                                navigate({
                                    pathname: location.pathname,
                                    search: newParams.toString(),
                                });
                            }}
                        >
                            sourceId: {id} ✕
                        </Button>
                    ))}
                </div>
            )}
            <EnhancedTable
                data={preparedVideos}
                columns={columns}
                getRowId={(item) => item.id}
                sortState={[{column: sortOrder.columnId, order: sortOrder.order}]}
                onSortStateChange={(sort) => handleSortChange(sort[0])}
                // loading={loading}
                emptyMessage="No prepared videos found"
                onSelectionChange={() => {}}
                selectedIds={[]}
                onRowClick={(row) => {
                    navigate(`/prepared-videos/${row.id}`);
                }}
            />
            <h3>Total Items: {totalItems}</h3>
            <div style={{marginTop: 20, display: 'flex', justifyContent: 'center'}}>
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

export default List;
