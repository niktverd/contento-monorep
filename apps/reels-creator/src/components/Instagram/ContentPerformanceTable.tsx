import React from 'react';

import {Box, Table, TableBody, TableCell, TableHead, TableRow, Typography} from '@material-ui/core';

export function ContentPerformanceTable() {
    // TODO: интеграция с реальными данными
    return (
        <Box mt={2}>
            <Typography variant="subtitle1">Content Performance</Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Preview</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Likes</TableCell>
                        <TableCell>Comments</TableCell>
                        <TableCell>Reach</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {/* TODO: map data */}
                    <TableRow>
                        <TableCell>[img]</TableCell>
                        <TableCell>2024-05-01</TableCell>
                        <TableCell>123</TableCell>
                        <TableCell>10</TableCell>
                        <TableCell>1000</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
    );
}
