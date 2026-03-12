import React from 'react';

import {Box, Typography} from '@material-ui/core';

export function BestTimeToPost() {
    // TODO: интеграция с реальными данными
    return (
        <Box mt={2}>
            <Typography variant="subtitle1">Best Time to Post</Typography>
            <Box
                height={120}
                bgcolor="#f0f0f0"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography variant="caption">[Heatmap placeholder]</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
                Recommendation: Post on weekdays at 18:00 for best engagement (mock)
            </Typography>
        </Box>
    );
}
