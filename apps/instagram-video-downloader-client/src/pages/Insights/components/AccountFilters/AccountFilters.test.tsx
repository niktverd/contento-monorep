import React from 'react';

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {AccountFilters} from './AccountFilters';

// Mock lodash debounce
jest.mock('lodash', () => ({
    debounce: (fn: (...args: unknown[]) => unknown) => {
        const mockFn = jest.fn(fn);
        (mockFn as typeof mockFn & {cancel: () => void}).cancel = jest.fn();
        return mockFn;
    },
}));

describe('AccountFilters', () => {
    const mockOnAccountToggle = jest.fn();
    const mockOnSearchChange = jest.fn();

    const defaultProps = {
        accounts: ['total', 'account1', 'account2', 'account3', 'test_account'],
        selectedAccounts: ['total', 'account1'],
        searchQuery: '',
        onAccountToggle: mockOnAccountToggle,
        onSearchChange: mockOnSearchChange,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render with title and search input', () => {
            render(<AccountFilters {...defaultProps} />);

            expect(screen.getByText('Filter Accounts')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Search accounts...')).toBeInTheDocument();
        });

        it('should render all accounts as checkboxes', () => {
            render(<AccountFilters {...defaultProps} />);

            expect(screen.getByRole('checkbox', {name: /All Accounts/})).toBeInTheDocument();
            expect(screen.getByRole('checkbox', {name: /account1/})).toBeInTheDocument();
            expect(screen.getByRole('checkbox', {name: /account2/})).toBeInTheDocument();
            expect(screen.getByRole('checkbox', {name: /account3/})).toBeInTheDocument();
            expect(screen.getByRole('checkbox', {name: /test_account/})).toBeInTheDocument();
        });

        it('should show selected accounts as checked', () => {
            render(<AccountFilters {...defaultProps} />);

            const totalCheckbox = screen.getByRole('checkbox', {name: /All Accounts/});
            const account1Checkbox = screen.getByRole('checkbox', {name: /account1/});
            const account2Checkbox = screen.getByRole('checkbox', {name: /account2/});

            expect(totalCheckbox).toBeChecked();
            expect(account1Checkbox).toBeChecked();
            expect(account2Checkbox).not.toBeChecked();
        });

        it('should display correct selection count', () => {
            render(<AccountFilters {...defaultProps} />);

            expect(screen.getByText('2 of 5 accounts selected')).toBeInTheDocument();
        });
    });

    describe('Search functionality', () => {
        it('should update search input value', async () => {
            const user = userEvent.setup();
            render(<AccountFilters {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('Search accounts...');
            await user.type(searchInput, 'account1');

            expect(searchInput).toHaveValue('account1');
        });

        it('should call onSearchChange when typing in search input', async () => {
            const user = userEvent.setup();
            render(<AccountFilters {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('Search accounts...');
            await user.type(searchInput, 'a');

            expect(mockOnSearchChange).toHaveBeenCalledWith('a');
        });

        it('should filter accounts based on search query', () => {
            render(<AccountFilters {...defaultProps} searchQuery="account1" />);

            expect(screen.getByRole('checkbox', {name: /account1/})).toBeInTheDocument();
            expect(screen.queryByRole('checkbox', {name: /account2/})).not.toBeInTheDocument();
            expect(screen.queryByRole('checkbox', {name: /test_account/})).not.toBeInTheDocument();
        });

        it('should filter accounts case-insensitively', () => {
            render(<AccountFilters {...defaultProps} searchQuery="ACCOUNT1" />);

            expect(screen.getByRole('checkbox', {name: /account1/})).toBeInTheDocument();
            expect(screen.queryByRole('checkbox', {name: /account2/})).not.toBeInTheDocument();
        });

        it('should show partial match results', () => {
            render(<AccountFilters {...defaultProps} searchQuery="test" />);

            expect(screen.getByRole('checkbox', {name: /test_account/})).toBeInTheDocument();
            expect(screen.queryByRole('checkbox', {name: /account1/})).not.toBeInTheDocument();
        });

        it('should show no results message when no matches found', () => {
            render(<AccountFilters {...defaultProps} searchQuery="nonexistent" />);

            expect(
                screen.getByText('No accounts found matching "nonexistent"'),
            ).toBeInTheDocument();
            expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        });

        it('should update selection count when filtering', () => {
            render(
                <AccountFilters
                    {...defaultProps}
                    searchQuery="account"
                    selectedAccounts={['account1', 'account2']}
                />,
            );

            expect(screen.getByText('2 of 4 accounts selected')).toBeInTheDocument();
        });

        it('should show all accounts when search is empty', () => {
            render(<AccountFilters {...defaultProps} searchQuery="" />);

            expect(screen.getByRole('checkbox', {name: /All Accounts/})).toBeInTheDocument();
            expect(screen.getByRole('checkbox', {name: /account1/})).toBeInTheDocument();
            expect(screen.getByRole('checkbox', {name: /account2/})).toBeInTheDocument();
            expect(screen.getByRole('checkbox', {name: /account3/})).toBeInTheDocument();
            expect(screen.getByRole('checkbox', {name: /test_account/})).toBeInTheDocument();
        });
    });

    describe('Account selection', () => {
        it('should call onAccountToggle for total account', async () => {
            const user = userEvent.setup();
            render(<AccountFilters {...defaultProps} />);

            const totalCheckbox = screen.getByRole('checkbox', {name: /All Accounts/});
            await user.click(totalCheckbox);

            expect(mockOnAccountToggle).toHaveBeenCalledWith('total');
        });

        it('should call onAccountToggle for regular accounts', async () => {
            const user = userEvent.setup();
            render(<AccountFilters {...defaultProps} />);

            const account2Checkbox = screen.getByRole('checkbox', {name: /account2/});
            await user.click(account2Checkbox);

            expect(mockOnAccountToggle).toHaveBeenCalledWith('account2');
        });

        it('should display correct account name for total', () => {
            render(<AccountFilters {...defaultProps} />);

            expect(screen.getByText('All Accounts')).toBeInTheDocument();
        });

        it('should display regular account names unchanged', () => {
            render(<AccountFilters {...defaultProps} />);

            expect(screen.getByText('account1')).toBeInTheDocument();
            expect(screen.getByText('account2')).toBeInTheDocument();
            expect(screen.getByText('test_account')).toBeInTheDocument();
        });
    });

    describe('State synchronization', () => {
        it('should sync local search with external searchQuery prop', () => {
            const {rerender} = render(<AccountFilters {...defaultProps} searchQuery="" />);

            const searchInput = screen.getByPlaceholderText('Search accounts...');
            expect(searchInput).toHaveValue('');

            rerender(<AccountFilters {...defaultProps} searchQuery="test" />);
            expect(searchInput).toHaveValue('test');
        });

        it('should handle empty accounts array', () => {
            render(<AccountFilters {...defaultProps} accounts={[]} />);

            expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
            expect(screen.queryByText(/accounts selected/)).not.toBeInTheDocument();
        });

        it('should handle empty selectedAccounts array', () => {
            render(<AccountFilters {...defaultProps} selectedAccounts={[]} />);

            const totalCheckbox = screen.getByRole('checkbox', {name: /All Accounts/});
            const account1Checkbox = screen.getByRole('checkbox', {name: /account1/});

            expect(totalCheckbox).not.toBeChecked();
            expect(account1Checkbox).not.toBeChecked();
            expect(screen.getByText('0 of 5 accounts selected')).toBeInTheDocument();
        });
    });
});
