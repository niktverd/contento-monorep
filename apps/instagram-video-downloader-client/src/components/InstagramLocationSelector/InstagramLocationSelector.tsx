/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, ButtonIcon, Table, TextInput, withTableSelection} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {GetAllInstagramLocationsResponse, IInstagramLocation} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchGet} from '../../utils/fetchHelpers';

// Create table with selection HOC
const SelectableTable = withTableSelection(Table);

// Helper function to filter out unwanted fields from location objects
const filterLocationFields = (location: IInstagramLocation) => {
    const {id, externalId, externalIdSource, name, address, lat, lng, group} = location;
    return {
        id,
        externalId,
        externalIdSource,
        name,
        address,
        lat,
        lng,
        group,
    };
};

type InstagramLocationSelectorProps = {
    selectedLocations: IInstagramLocation[];
    onSelectionChange: (locations: IInstagramLocation[]) => void;
    title?: string;
};

export const InstagramLocationSelector = ({
    selectedLocations = [],
    onSelectionChange,
    title = 'Instagram Locations',
}: InstagramLocationSelectorProps) => {
    const {isProd} = useContext(AppEnvContext);
    const [locations, setLocations] = useState<IInstagramLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [debouncedGroupFilter, setDebouncedGroupFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;
    const [totalCount, setTotalCount] = useState(0);

    // Debounce search text
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
            setCurrentPage(0); // Reset to first page when search changes
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchText]);

    // Debounce group filter
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedGroupFilter(groupFilter);
            setCurrentPage(0); // Reset to first page when filter changes
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [groupFilter]);

    // Fetch Instagram locations with server-side pagination and filtering
    const fetchLocations = useCallback(
        async (page: number, search: string, group: string) => {
            setLoading(true);
            try {
                const locationsData = await fetchGet<GetAllInstagramLocationsResponse>({
                    route: fetchRoutes.instagramLocations.list,
                    query: {
                        page: page + 1, // Convert to 1-based indexing for server
                        limit: pageSize,
                        commonTextFilter: search || undefined, // Don't send empty search
                        groupTextFilter: group || undefined, // Don't send empty group filter
                    },
                    isProd,
                });
                setLocations(locationsData.locations || []);
                setTotalCount(locationsData.count || 0);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Failed to load Instagram locations:', err);
                setLocations([]);
                setTotalCount(0);
            } finally {
                setLoading(false);
            }
        },
        [isProd, pageSize],
    );

    // Fetch data when page or search changes
    useEffect(() => {
        fetchLocations(currentPage, debouncedSearchText, debouncedGroupFilter);
    }, [fetchLocations, currentPage, debouncedSearchText, debouncedGroupFilter]);

    // Table columns configuration
    const columns = [
        {
            id: 'name',
            name: 'Name',
            template: (item: IInstagramLocation) => item.name || 'N/A',
        },
        {
            id: 'externalId',
            name: 'External ID',
            template: (item: IInstagramLocation) => item.externalId || 'N/A',
        },
        {
            id: 'address',
            name: 'Address',
            template: (item: IInstagramLocation) => item.address || 'N/A',
        },
        {
            id: 'group',
            name: 'Group',
            template: (item: IInstagramLocation) => item.group || 'N/A',
        },
    ];

    // Get selected location IDs for the table
    const selectedLocationIds = selectedLocations.map((loc) => loc.id.toString());

    // Handle table selection changes
    const handleSelectionChange = (selectedIds: string[]) => {
        const currentPageLocationIds = locations.map((l) => l.id.toString());
        const currentlySelected = selectedLocations.map((loc) => loc.id.toString());

        // Find what was selected/deselected on current page only
        const currentPageSelected = selectedIds.filter((id) => currentPageLocationIds.includes(id));
        const currentPageCurrentlySelected = currentlySelected.filter((id) =>
            currentPageLocationIds.includes(id),
        );

        // Find newly selected and newly deselected items
        const newlySelected = currentPageSelected.filter(
            (id) => !currentPageCurrentlySelected.includes(id),
        );
        const newlyDeselected = currentPageCurrentlySelected.filter(
            (id) => !currentPageSelected.includes(id),
        );

        // Start with existing selections
        let updatedLocations = [...selectedLocations];

        // Add newly selected locations
        newlySelected.forEach((id) => {
            const locationId = parseInt(id, 10);
            const location = locations.find((l) => l.id === locationId);
            if (location && !updatedLocations.some((l) => l.id === locationId)) {
                updatedLocations.push(filterLocationFields(location));
            }
        });

        // Remove newly deselected locations
        newlyDeselected.forEach((id) => {
            const locationId = parseInt(id, 10);
            updatedLocations = updatedLocations.filter((l) => l.id !== locationId);
        });

        onSelectionChange(updatedLocations);
    };

    // Handle removing location from selected chips
    const handleRemoveLocation = (index: number) => {
        const newLocations = [...selectedLocations];
        newLocations.splice(index, 1);
        onSelectionChange(newLocations);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    // Helper to build filter description
    const getFilterDescription = () => {
        const filters = [];
        if (debouncedSearchText) filters.push(`search: "${debouncedSearchText}"`);
        if (debouncedGroupFilter) filters.push(`group: "${debouncedGroupFilter}"`);
        return filters.length > 0 ? ` (filtered by ${filters.join(', ')})` : '';
    };

    return (
        <div style={{marginTop: 20}}>
            <h3>{title}</h3>

            {/* Selected locations display */}
            {selectedLocations.length > 0 && (
                <div style={{marginBottom: 15}}>
                    <h4>Selected Locations ({selectedLocations.length})</h4>
                    <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10}}>
                        {selectedLocations.map((locationRef, index) => {
                            const location = locations.find((l) => l.id === locationRef.id);
                            return (
                                <div
                                    key={index}
                                    style={{
                                        border: '2px solid #2196f3',
                                        padding: 12,
                                        borderRadius: 18,
                                        display: 'inline-flex',
                                        gap: 10,
                                        alignItems: 'center',
                                    }}
                                >
                                    {location
                                        ? location.name || location.externalId
                                        : locationRef.name ||
                                          locationRef.externalId ||
                                          locationRef.id}
                                    <Button onClick={() => handleRemoveLocation(index)}>
                                        <ButtonIcon>
                                            <Xmark />
                                        </ButtonIcon>
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Search inputs */}
            <div style={{marginBottom: 15}}>
                <div style={{display: 'flex', gap: 10, marginBottom: 10}}>
                    <div style={{flex: 1}}>
                        <TextInput
                            placeholder="Search by name or address..."
                            value={searchText}
                            onUpdate={setSearchText}
                            size="l"
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <TextInput
                            placeholder="Filter by group..."
                            value={groupFilter}
                            onUpdate={setGroupFilter}
                            size="l"
                        />
                    </div>
                </div>
                {loading && <div style={{marginTop: 5, fontSize: 12}}>Searching...</div>}
            </div>

            {/* Locations table */}
            {loading && !locations.length ? (
                <div>Loading locations...</div>
            ) : (
                <div>
                    <SelectableTable
                        data={locations}
                        columns={columns}
                        getRowId={(item: IInstagramLocation) => item.id.toString()}
                        selectedIds={selectedLocationIds}
                        onSelectionChange={handleSelectionChange}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: 15,
                                padding: 10,
                            }}
                        >
                            <div>
                                Showing {currentPage * pageSize + 1}-
                                {Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount}{' '}
                                locations
                                {getFilterDescription()}
                            </div>
                            <div style={{display: 'flex', gap: 10}}>
                                <Button
                                    disabled={currentPage === 0 || loading}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    Previous
                                </Button>
                                <span style={{alignSelf: 'center'}}>
                                    Page {currentPage + 1} of {totalPages}
                                </span>
                                <Button
                                    disabled={currentPage >= totalPages - 1 || loading}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {!loading && totalCount === 0 && (
                        <div style={{textAlign: 'center', padding: 20}}>
                            {debouncedSearchText || debouncedGroupFilter
                                ? `No locations found for the applied filters`
                                : 'No locations available'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
