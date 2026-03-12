import React from 'react';

import {CircularProgress, Typography} from '@material-ui/core';

export const LoadingState = () => {
    return (
        <div style={{textAlign: 'center', padding: '30px 0'}}>
            <CircularProgress size={30} />
            <Typography variant="body1" style={{marginTop: 10}}>
                Loading Instagram media...
            </Typography>
        </div>
    );
};
