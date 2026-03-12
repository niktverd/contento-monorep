/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import axios from 'axios';

import type {DirectMessage} from '../types';

const {useCallback, useState} = React;

export function useMessagingHub() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [selectedThread, setSelectedThread] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Загрузка диалогов
    const fetchConversations = useCallback(async (limit = 20, status?: string) => {
        setLoading(true);
        setError(null);
        try {
            const {data} = await axios.get('/api/instagram/messages/conversations', {
                params: {limit, status},
            });
            setConversations(data.data.conversations || []);
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    }, []);

    // Загрузка сообщений в треде
    const fetchMessages = useCallback(async (threadId: string, limit = 50) => {
        setLoading(true);
        setError(null);
        try {
            const {data} = await axios.get('/api/instagram/messages/thread', {
                params: {threadId, limit},
            });
            setMessages(data.data.messages || []);
            setSelectedThread(threadId);
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    }, []);

    // Отправка сообщения
    const sendMessage = useCallback(
        async (threadId: string, message: string) => {
            try {
                await axios.post('/api/instagram/messages/send', {threadId, message});
                fetchMessages(threadId);
            } catch (e: any) {
                setError(e?.message || 'Failed to send message');
            }
        },
        [fetchMessages],
    );

    // Назначение оператора
    const assignAgent = useCallback(
        async (threadId: string, agentId: string) => {
            try {
                await axios.post('/api/instagram/messages/assign', {threadId, agentId});
                fetchConversations();
            } catch (e: any) {
                setError(e?.message || 'Failed to assign agent');
            }
        },
        [fetchConversations],
    );

    return {
        conversations,
        messages,
        selectedThread,
        loading,
        error,
        fetchConversations,
        fetchMessages,
        sendMessage,
        assignAgent,
        setSelectedThread,
    };
}
