import React, { useMemo } from "react";
import { Box, Text, Static } from "ink";
import { ChatMessage } from "../../types/chat.js";
import Markdown from "./Markdown.js";

export type StaticItem =
    | { id: string; type: 'header'; projectRoot?: string }
    | { id: string; type: 'message'; message: ChatMessage };

interface MessageListProps {
    messages?: ChatMessage[];
    items?: StaticItem[];
    projectRoot?: string;
}

function MessageList({ messages, items: propItems, projectRoot }: MessageListProps) {
    const items = useMemo<StaticItem[]>(() => {
        if (propItems) return propItems;

        const list: StaticItem[] = [
            { id: 'header', type: 'header', projectRoot }
        ];

        let msgIndex = 0;

        for (const msg of messages ?? []) {
            if (msg.role === 'system') continue;
            if (msg.role === 'assistant' && !msg.content) continue;

            list.push({
                id: `msg-${msgIndex++}`,
                type: 'message',
                message: msg
            });
        }

        return list;
    }, [messages, propItems, projectRoot]);

    return (
        <Static items={items} style={{ paddingX: 1 }}>
            {(item) => {
                if (item.type === 'header') {
                    return (
                        <Box
                            key={item.id}
                            marginBottom={1}
                            flexDirection='column'
                        >
                            <Text bold color='green'>
                                WnCC Agentic CLI
                            </Text>

                            {item.projectRoot && (
                                <Text dimColor>
                                    {`Project root: ${item.projectRoot}`}
                                </Text>
                            )}
                        </Box>
                    );
                }

                const { message } = item;

                switch (message.role) {
                    case 'system':
                        return null;

                    case 'user':
                        return (
                            <Box
                                key={item.id}
                                flexDirection='column'
                                marginBottom={1}
                            >
                                <Text bold color='cyan'>
                                    You:
                                </Text>

                                <Box paddingLeft={2}>
                                    <Text>{message.content}</Text>
                                </Box>
                            </Box>
                        );

                    case 'assistant':
                        if (!message.content) return null;

                        return (
                            <Box
                                key={item.id}
                                flexDirection='column'
                                marginBottom={1}
                            >
                                <Text bold color='magenta'>
                                    Assistant:
                                </Text>

                                <Box paddingLeft={2}>
                                    <Markdown>
                                        {message.content}
                                    </Markdown>
                                </Box>
                            </Box>
                        );

                    case 'tool':
                        return (
                            <Box
                                key={item.id}
                                paddingLeft={2}
                                marginBottom={0}
                                flexDirection='column'
                            >
                                <Box>
                                    <Text color='green'>
                                        ⎿
                                    </Text>

                                    <Text color='gray'>
                                        {' '}🛠️ {message.name}:{' '}
                                    </Text>

                                    <Text color='cyan'>
                                        {message.summary ?? ''}
                                    </Text>
                                </Box>

                                {message.name === 'search_files' && (
                                    <Box paddingLeft={4}>
                                        <Text color='gray'>
                                            {message.content}
                                        </Text>
                                    </Box>
                                )}
                            </Box>
                        );

                    default:
                        return null;
                }
            }}
        </Static>
    );
}

export default React.memo(MessageList);