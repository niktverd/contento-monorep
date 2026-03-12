import React from 'react';

import {CircularProgress, Typography} from '@material-ui/core';

interface InstagramLoadingStateProps {
    message?: string;
}

export const InstagramLoadingState = ({
    message = 'Loading Instagram data...',
}: InstagramLoadingStateProps) => {
    return (
        <div style={{textAlign: 'center', padding: '50px 0'}}>
            <CircularProgress />
            <Typography variant="body1" style={{marginTop: 16}}>
                {message}
            </Typography>
        </div>
    );
};
