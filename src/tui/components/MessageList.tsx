import { Box, Text } from "ink";
import { ChatMessage } from "../../types/chat.js";

interface MessageListProps {
    messages: ChatMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
    return (
        <Box flexDirection='column'>
            {
                messages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const isSystem = message.role === 'system';
                    if (isSystem) return;
                    return (
                        <Box key={index} flexDirection='column' marginBottom={1}>
                            <Text bold color={isUser ? 'cyan' : 'magenta'}>
                                {isUser ? 'You:' : 'Assistant:'}
                            </Text>
                            <Box paddingLeft={2}>
                                <Text>{message.content}</Text>
                            </Box>
                        </Box>
                    );
                })
            }
        </Box>
    )
}