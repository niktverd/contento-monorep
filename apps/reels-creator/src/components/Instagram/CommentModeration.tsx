import React from 'react';

import {Box, Button, Typography} from '@material-ui/core';

import type {Comment} from './types';

const {useState} = React;

export function CommentModeration({
    comments,
    hideComment,
    deleteComment,
}: {
    comments: Comment[];
    hideComment: (commentId: string) => void;
    deleteComment: (commentId: string) => void;
}) {
    const [selected, setSelected] = useState<string[]>([]);

    // const toggle = (id: string) => {
    //     setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
    // };

    const handleHide = () => {
        selected.forEach(hideComment);
        setSelected([]);
    };
    const handleDelete = () => {
        selected.forEach(deleteComment);
        setSelected([]);
    };

    if (!comments.length) return null;

    return (
        <Box mb={2}>
            <Typography variant="caption">Массовые действия:</Typography>
            <Box display="flex" alignItems="center" mb={1}>
                <Button size="small" onClick={handleHide} disabled={!selected.length}>
                    Скрыть выбранные
                </Button>
                <Button
                    size="small"
                    color="secondary"
                    onClick={handleDelete}
                    disabled={!selected.length}
                    style={{marginLeft: 8}}
                >
                    Удалить выбранные
                </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" sx={{justifyContent: 'space-between'}}>
                {/* {comments.map((c) => (
                    <Box key={c.id} display="flex" alignItems="center" mr={2}>
                        <Checkbox checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                        <Typography variant="body2">
                            {c.text.slice(0, 40)}
                            {c.text.length > 40 ? '...' : ''}
                        </Typography>
                    </Box>
                ))} */}
            </Box>
        </Box>
    );
}
