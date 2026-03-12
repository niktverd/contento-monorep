/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import axios from 'axios';

import type {Comment} from '../types';

const {useCallback, useState} = React;

export function useCommentsManager(mediaId?: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Загрузка комментариев
    const fetchComments = useCallback(async () => {
        if (!mediaId) return;
        setLoading(true);
        setError(null);
        try {
            const {data} = await axios.get('/api/instagram/comments/list', {
                params: {mediaId},
            });
            setComments(data || []);
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch comments');
        } finally {
            setLoading(false);
        }
    }, [mediaId]);

    // Ответ на комментарий
    const replyToComment = useCallback(
        async (commentId: string, message: string) => {
            try {
                await axios.post('/api/instagram/comments/reply', {commentId, message});
                fetchComments();
            } catch (e: any) {
                setError(e?.message || 'Failed to reply');
            }
        },
        [fetchComments],
    );

    // Скрыть комментарий
    const hideComment = useCallback(
        async (commentId: string) => {
            try {
                await axios.post('/api/instagram/comments/hide', {commentId});
                fetchComments();
            } catch (e: any) {
                setError(e?.message || 'Failed to hide');
            }
        },
        [fetchComments],
    );

    // Удалить комментарий
    const deleteComment = useCallback(
        async (commentId: string) => {
            try {
                await axios.post('/api/instagram/comments/delete', {commentId});
                fetchComments();
            } catch (e: any) {
                setError(e?.message || 'Failed to delete');
            }
        },
        [fetchComments],
    );

    // Фильтрация
    const filterComments = useCallback(
        async (keywords: string[] = [], status?: string, hasReply?: boolean) => {
            setLoading(true);
            setError(null);
            try {
                const {data} = await axios.get('/api/instagram/comments/filter', {
                    params: {keywords, status, hasReply},
                });
                setComments(data.data.comments || []);
            } catch (e: any) {
                setError(e?.message || 'Failed to filter');
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    return {
        comments,
        loading,
        error,
        fetchComments,
        replyToComment,
        hideComment,
        deleteComment,
        filterComments,
    };
}
