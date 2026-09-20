import React from "react";
import { Box, Text } from "ink";
import { ChatMessage } from "../../types/chat.js";
import Markdown from "./Markdown.js";

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
                                            <Markdown>{message.content}</Markdown>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        );

                    case 'tool':
                        return (
                            <Box key={index} paddingLeft={2} marginBottom={0}>
                                <Text color='green'>⎿  </Text>
                                <Text color='gray'>🛠️  {message.name}: </Text>
                                <Text color='cyan'>{message.summary ?? message.content}</Text>
                            </Box>
                        );
                }
            })}
        </Box>
    );
}

export default React.memo(MessageList);