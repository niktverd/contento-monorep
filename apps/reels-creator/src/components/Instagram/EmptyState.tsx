import React from 'react';

import {Button, CircularProgress, Typography} from '@material-ui/core';

interface EmptyStateProps {
    onRefresh: () => void;
    loading: boolean;
}

export const EmptyState = ({onRefresh, loading}: EmptyStateProps) => {
    return (
        <div style={{marginTop: 30, textAlign: 'center'}}>
            <Typography variant="h6">No Instagram Media Found</Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={onRefresh}
                style={{marginTop: 16}}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : 'Refresh Media'}
            </Button>
        </div>
    );
};
