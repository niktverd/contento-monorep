import React from 'react';

import {Box, Paper, Typography} from '@material-ui/core';

export function AgentDashboard() {
    // TODO: интеграция с реальными данными
    return (
        <Paper variant="outlined" style={{padding: 24, marginBottom: 24}}>
            <Typography variant="h6">Статистика оператора</Typography>
            <Box mt={2}>
                <Typography>Обработано диалогов: 12</Typography>
                <Typography>Среднее время ответа: 2 мин</Typography>
                <Typography>Рейтинг удовлетворенности: 4.8/5</Typography>
            </Box>
            <Box mt={4}>
                <Typography variant="subtitle1">Очередь диалогов</Typography>
                <Typography>В работе: 3</Typography>
                <Typography>Ожидают ответа: 2</Typography>
            </Box>
        </Paper>
    );
}
