import React from "react";
import { Box, Text } from "ink";
import { ChatMessage } from "../../types/chat.js";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

marked.use(markedTerminal() as any);

interface MessageListProps {
    messages: ChatMessage[];
}

function MessageList({ messages }: MessageListProps) {
    return (
        <Box flexDirection='column'>
            {messages.map((message, index) => {
                switch (message.role) {
                    case 'system':
                        return null;

                    case 'user':
                        return (
                            <Box key={index} flexDirection='column' marginBottom={1}>
                                <Text bold color='cyan'>You:</Text>
                                <Box paddingLeft={2}>
                                    <Text>{message.content}</Text>
                                </Box>
                            </Box>
                        );

                    case 'assistant':
                        return (
                            <Box key={index} flexDirection='column' marginBottom={1}>
                                {message.content && (
                                    <>
                                        <Text bold color='magenta'>Assistant:</Text>
                                        <Box paddingLeft={2}>
                                            <Text>{(marked.parse(message.content) as string).trim()}</Text>
                                        </Box>
                                    </>
                                )}
                                {message.toolCalls?.map((tc) => (
                                    <Box key={tc.id} flexDirection='column' paddingLeft={2} marginTop={message.content ? 1 : 0}>
                                        <Text color='yellow'>
                                            🛠️  Call: <Text bold>{tc.name}</Text>
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        );

                    case 'tool':
                        return (
                            <Box key={index} paddingLeft={2} marginBottom={1}>
                                <Text color='green'>⎿  </Text>
                                <Text color='gray'>[{message.name}]: </Text>
                                <Text color='cyan'>{message.summary ?? message.content}</Text>
                            </Box>
                        );
                }
            })}
        </Box>
    );
}

export default React.memo(MessageList);