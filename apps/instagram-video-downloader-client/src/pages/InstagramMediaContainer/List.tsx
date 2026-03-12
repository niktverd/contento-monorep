import React, {useCallback, useContext, useEffect, useState} from 'react';

import {
    Button,
    Pagination,
    Table,
    TableColumnConfig,
    TableDataItem,
    withTableActions,
    withTableSelection,
    withTableSorting,
} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllInstagramMediaContainersResponse, IInstagramMediaContainer} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

const EnhancedTable = withTableSelection(withTableSorting(withTableActions(Table)));

const List: React.FC = () => {
    const navigate = useNavigate();
    const [mediaContainers, setMediaContainers] = useState<IInstagramMediaContainer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const {isProd} = useContext(AppEnvContext);

    const loadMediaContainers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const query =
                page === 1
                    ? {}
                    : {
                          page,
                          limit: pageSize,
                      };
            const response = await fetchGet<GetAllInstagramMediaContainersResponse>({
                route: fetchRoutes.instagramMediaContainers.list,
                query,
                isProd,
            });
            setMediaContainers(response.mediaContainers);
            setTotalItems(response.count);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || 'Failed to load Instagram media containers');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, isProd]);

    useEffect(() => {
        loadMediaContainers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    const handlePageChange = (newPage: number) => setPage(newPage);

    const columns: TableColumnConfig<TableDataItem>[] = [
        {id: 'id', name: 'ID'},
        {id: 'preparedVideoId', name: 'PreparedVideoId'},
        {id: 'accountId', name: 'AccountId'},
        {
            id: 'isPublished',
            name: 'Published',
            template: (item: IInstagramMediaContainer) => (item.isPublished ? 'Yes' : 'No'),
        },
        {id: 'lastCheckedIGStatus', name: 'IG Status'},
        {id: 'error', name: 'Error'},
        {id: 'containerId', name: 'ContainerId'},
        {id: 'mediaId', name: 'MediaId'},
        {id: 'caption', name: 'Caption'},
        {
            id: 'hashtags',
            name: 'Hashtags',
            template: (item: IInstagramMediaContainer) =>
                item.hashtags ? item.hashtags.join(', ') : '',
        },
        {
            id: 'isBlocked',
            name: 'Blocked',
            template: (item: IInstagramMediaContainer) => (item.isBlocked ? 'Yes' : 'No'),
        },
        {id: 'blockedReason', name: 'BlockedReason'},
        {id: 'attempts', name: 'Attempts'},
        {id: 'audioName', name: 'AudioName'},
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
                <h2>Instagram Media Containers</h2>
                <div style={{display: 'flex', gap: 8}}>
                    <Button view="action" onClick={loadMediaContainers} loading={loading}>
                        Refresh
                    </Button>
                    <Button view="action" href="/instagram-media-containers/statistics">
                        Statistics
                    </Button>
                </div>
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
            <EnhancedTable
                data={mediaContainers}
                columns={columns}
                getRowId={(item) => item.id}
                emptyMessage="No Instagram media containers found"
                onSelectionChange={() => {}}
                selectedIds={[]}
                onRowClick={(row) => {
                    navigate(`/instagram-media-containers/${row.id}`);
                }}
            />
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
