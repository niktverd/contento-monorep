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
import {GetAllInstagramLocationsResponse, IInstagramLocation} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

const EnhancedTable = withTableSelection(withTableSorting(withTableActions(Table)));

const List: React.FC = () => {
    const navigate = useNavigate();
    const [locations, setLocations] = useState<IInstagramLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const {isProd} = useContext(AppEnvContext);

    const loadLocations = useCallback(async () => {
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
            const response = await fetchGet<GetAllInstagramLocationsResponse>({
                route: fetchRoutes.instagramLocations.list,
                query,
                isProd,
            });
            setLocations(response.locations);
            setTotalItems(response.count);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || 'Failed to load Instagram locations');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, isProd]);

    useEffect(() => {
        loadLocations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    const handlePageChange = (newPage: number) => setPage(newPage);

    const columns: TableColumnConfig<TableDataItem>[] = [
        {id: 'id', name: 'ID'},
        {id: 'externalId', name: 'External ID'},
        {id: 'externalIdSource', name: 'External ID Source'},
        {id: 'name', name: 'Name'},
        {id: 'address', name: 'Address'},
        {id: 'lat', name: 'Latitude'},
        {id: 'lng', name: 'Longitude'},
        {id: 'group', name: 'Group'},
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
                <h2>Instagram Locations</h2>
                <div style={{display: 'flex', gap: 10}}>
                    <Button view="action" href={`/instagram-locations/new`}>
                        Create New
                    </Button>
                    <Button view="normal" onClick={loadLocations} loading={loading}>
                        Refresh
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
                data={locations}
                columns={columns}
                getRowId={(item) => item.id}
                emptyMessage="No Instagram locations found"
                onSelectionChange={() => {}}
                selectedIds={[]}
                onRowClick={(row) => {
                    navigate(`/instagram-locations/${row.id}`);
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
