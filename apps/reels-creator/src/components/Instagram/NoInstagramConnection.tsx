import React from 'react';

import {Typography} from '@material-ui/core';

export const NoInstagramConnection = () => {
    return (
        <div style={{textAlign: 'center', padding: '50px 0'}}>
            <Typography variant="h5" gutterBottom>
                No Instagram Account Connected
            </Typography>
            <Typography variant="body1">
                Connect your Instagram account to view your profile data and media.
            </Typography>
        </div>
    );
};
