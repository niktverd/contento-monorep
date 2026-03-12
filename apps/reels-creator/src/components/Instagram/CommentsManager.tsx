/* eslint-disable no-nested-ternary */
import React from 'react';

import {Box, Button, CircularProgress, TextField, Typography} from '@material-ui/core';

import {CommentModeration} from './CommentModeration';
import {CommentThread} from './CommentThread';
import {useCommentsManager} from './hooks/useCommentsManager';

const {useEffect, useState} = React;

export function CommentsManager({mediaId}: {mediaId: string}) {
    const {
        comments,
        loading,
        error,
        fetchComments,
        replyToComment,
        hideComment,
        deleteComment,
        filterComments,
    } = useCommentsManager(mediaId);

    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    return (
        <Box>
            <Box display="flex" alignItems="center" mb={2}>
                <TextField
                    label="Фильтр по ключевым словам"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    size="small"
                    variant="outlined"
                    style={{marginRight: 16}}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => filterComments(filter ? [filter] : [])}
                >
                    Применить фильтр
                </Button>
                <Button variant="outlined" style={{marginLeft: 8}} onClick={fetchComments}>
                    Сбросить
                </Button>
            </Box>
            <CommentModeration
                comments={comments}
                hideComment={hideComment}
                deleteComment={deleteComment}
            />
            {loading ? (
                <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : comments.length === 0 ? (
                <Typography variant="body2">Нет комментариев</Typography>
            ) : (
                comments.map((comment) => (
                    <CommentThread
                        key={comment.media_id}
                        comment={comment}
                        replyToComment={replyToComment}
                        hideComment={hideComment}
                        deleteComment={deleteComment}
                    />
                ))
            )}
        </Box>
    );
}
