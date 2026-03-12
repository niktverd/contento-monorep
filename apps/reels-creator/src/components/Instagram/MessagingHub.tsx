/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import {
    Box,
    // Button,
    CircularProgress,
    // Divider,
    List,
    ListItem,
    ListItemText,
    Typography,
} from '@material-ui/core';

import {MessageComposer} from './MessageComposer';
import {useMessagingHub} from './hooks/useMessagingHub';

const {useEffect} = React;

export function MessagingHub() {
    const {
        conversations,
        messages,
        selectedThread,
        loading,
        // error,
        fetchConversations,
        fetchMessages,
        sendMessage,
        // setSelectedThread,
    } = useMessagingHub();

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return (
        <Box display="flex" height={500} border={1} borderColor="#eee" borderRadius={4}>
            {/* Список диалогов */}
            <Box width={300} borderRight={1} borderColor="#eee" overflow="auto">
                <Box p={2} borderBottom={1} borderColor="#eee">
                    <Typography variant="h6">Диалоги</Typography>
                </Box>
                {loading ? (
                    <CircularProgress />
                ) : (
                    <List>
                        {conversations.length === 0 ? (
                            <ListItem>
                                <ListItemText primary="Нет диалогов" />
                            </ListItem>
                        ) : (
                            conversations.map((conv: any) => (
                                <ListItem
                                    button
                                    key={conv.id}
                                    selected={selectedThread === conv.id}
                                    onClick={() => fetchMessages(conv.id)}
                                >
                                    <ListItemText
                                        primary={conv.title || `Диалог ${conv.id}`}
                                        secondary={conv.lastMessage || ''}
                                    />
                                </ListItem>
                            ))
                        )}
                    </List>
                )}
            </Box>
            {/* Панель чата */}
            <Box flex={1} display="flex" flexDirection="column">
                <Box p={2} borderBottom={1} borderColor="#eee">
                    <Typography variant="h6">Чат</Typography>
                </Box>
                <Box flex={1} overflow="auto" p={2}>
                    {/* eslint-disable-next-line no-nested-ternary */}
                    {loading ? (
                        <CircularProgress />
                    ) : messages.length === 0 ? (
                        <Typography variant="body2">Нет сообщений</Typography>
                    ) : (
                        messages.map((msg) => (
                            <Box key={msg.id} mb={2}>
                                <Typography variant="caption" color="textSecondary">
                                    {msg.sender} → {msg.recipient} {msg.created_time}
                                </Typography>
                                <Typography variant="body1">{msg.text}</Typography>
                            </Box>
                        ))
                    )}
                </Box>
                {selectedThread && (
                    <Box p={2} borderTop={1} borderColor="#eee">
                        <MessageComposer onSend={(msg) => sendMessage(selectedThread, msg)} />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
