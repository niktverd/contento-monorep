import React, {useEffect, useMemo, useState} from 'react';

import {Card, Checkbox, Text, TextInput} from '@gravity-ui/uikit';
import {debounce} from 'lodash';

import {AccountFiltersProps} from '../../types';

import styles from './AccountFilters.module.css';

export const AccountFilters: React.FC<AccountFiltersProps> = ({
    accounts,
    selectedAccounts,
    searchQuery,
    onAccountToggle,
    onSearchChange,
}) => {
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    // Create debounced function that doesn't change on re-renders
    const debouncedSearch = useMemo(
        () =>
            debounce((query: string) => {
                onSearchChange(query);
            }, 300),
        [onSearchChange],
    );

    // Update local state when external searchQuery changes
    useEffect(() => {
        setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    // Cleanup function
    useEffect(() => {
        return () => {
            // Check if cancel method exists before calling
            if (debouncedSearch && typeof debouncedSearch.cancel === 'function') {
                debouncedSearch.cancel();
            }
        };
    }, [debouncedSearch]);

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setLocalSearchQuery(value);
        debouncedSearch(value);
    };

    // Filter accounts based on search query
    const filteredAccounts = useMemo(() => {
        if (!localSearchQuery.trim()) {
            return accounts;
        }
        return accounts.filter((account) =>
            account.toLowerCase().includes(localSearchQuery.toLowerCase()),
        );
    }, [accounts, localSearchQuery]);

    // Calculate summary stats
    const selectedFilteredAccounts = selectedAccounts.filter((account) =>
        filteredAccounts.includes(account),
    );

    return (
        <Card className="account-filters">
            <div className={styles.container}>
                <Text variant="subheader-2" className={styles.title}>
                    Filter Accounts
                </Text>

                {/* Search Input */}
                <div className={styles.searchInput}>
                    <TextInput
                        placeholder="Search accounts..."
                        value={localSearchQuery}
                        onUpdate={handleSearchChange}
                        style={{width: '100%'}}
                    />
                </div>

                {/* Account Checkboxes */}
                <div className={styles.checkboxList}>
                    {filteredAccounts.length > 0 ? (
                        filteredAccounts.map((account) => {
                            const isSelected = selectedAccounts.includes(account);
                            const displayName = account === 'total' ? 'All Accounts' : account;

                            return (
                                <Checkbox
                                    key={account}
                                    checked={isSelected}
                                    onUpdate={() => onAccountToggle(account)}
                                    size="m"
                                >
                                    <Text variant="body-2">{displayName}</Text>
                                </Checkbox>
                            );
                        })
                    ) : (
                        <Text variant="body-2" color="secondary">
                            {`No accounts found matching "${localSearchQuery}"`}
                        </Text>
                    )}
                </div>

                {/* Summary */}
                {filteredAccounts.length > 0 && (
                    <div className={styles.summary}>
                        <Text variant="caption-2" color="secondary">
                            {selectedFilteredAccounts.length} of {filteredAccounts.length} accounts
                            selected
                        </Text>
                    </div>
                )}
            </div>
        </Card>
    );
};
