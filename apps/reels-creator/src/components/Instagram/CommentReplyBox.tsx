import React from 'react';

import {Box, Button, TextField} from '@material-ui/core';

const {useState} = React;

export function CommentReplyBox({
    // commentId,
    onSend,
}: {
    commentId: string;
    onSend: (msg: string) => void;
}) {
    const [value, setValue] = useState('');
    const [sending, setSending] = useState(false);

    return (
        <Box display="flex" alignItems="center" mt={2}>
            <TextField
                value={value}
                onChange={(e) => setValue(e.target.value)}
                size="small"
                variant="outlined"
                placeholder="Ваш ответ..."
                style={{flex: 1, marginRight: 8}}
                disabled={sending}
            />
            <Button
                variant="contained"
                color="primary"
                disabled={!value.trim() || sending}
                onClick={async () => {
                    setSending(true);
                    await onSend(value);
                    setValue('');
                    setSending(false);
                }}
            >
                Отправить
            </Button>
        </Box>
    );
}
