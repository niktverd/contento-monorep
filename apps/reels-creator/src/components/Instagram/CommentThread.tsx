import React from 'react';

import {Box, Paper, Typography} from '@material-ui/core';

// import {CommentReplyBox} from './CommentReplyBox';
import type {Comment} from './types';

// const {useState} = React;

export function CommentThread({
    comment,
    // replyToComment,
    // hideComment,
    // deleteComment,
}: {
    comment: Comment;
    replyToComment: (commentId: string, message: string) => void;
    hideComment: (commentId: string) => void;
    deleteComment: (commentId: string) => void;
}) {
    // const [replyOpen, setReplyOpen] = useState(false);

    return (
        <Paper variant="outlined" style={{marginBottom: 16, padding: 16}}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="subtitle2">{comment.media_id}</Typography>
                    {/* <Typography variant="body2">{comment.text}</Typography>
                    <Typography variant="caption" color="textSecondary">
                        {comment.created_time}
                    </Typography> */}
                </Box>
                <Box>
                    {comment.comments.map((commentItem) => {
                        return (
                            <div key={commentItem.id}>
                                <div>{commentItem.id}</div>
                                <div>{commentItem.text}</div>
                            </div>
                        );
                    })}
                    {/* <Button size="small" onClick={() => setReplyOpen((v) => !v)}>
                        Ответить
                    </Button>
                    <Button size="small" onClick={() => hideComment(comment.id)}>
                        Скрыть
                    </Button>
                    <Button
                        size="small"
                        color="secondary"
                        onClick={() => deleteComment(comment.id)}
                    >
                        Удалить
                    </Button> */}
                </Box>
            </Box>
            {/* {replyOpen && (
                <CommentReplyBox
                    commentId={comment.id}
                    onSend={(msg) => {
                        replyToComment(comment.id, msg);
                        setReplyOpen(false);
                    }}
                />
            )} */}
            {/* {comment.replies && comment.replies.length > 0 && (
                <Box mt={2} ml={4}>
                    <Typography variant="caption">Ответы:</Typography>
                    {comment.replies.map((reply) => (
                        <Box key={reply.id} mt={1}>
                            <Typography variant="subtitle2">{reply.user}</Typography>
                            <Typography variant="body2">{reply.text}</Typography>
                            <Typography variant="caption" color="textSecondary">
                                {reply.created_time}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )} */}
        </Paper>
    );
}
