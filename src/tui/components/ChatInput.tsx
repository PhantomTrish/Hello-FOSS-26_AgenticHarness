import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input'

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
    isDisabled?: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, isDisabled = false }: ChatInputProps) {
    if (isDisabled) {
        return (
            <Box>
                <Text color="gray">&gt; Thinking...</Text>
            </Box>
        );
    }

    return (
        <Box>
            <Text color="green" bold>&gt; </Text>
            <TextInput
                value={value}
                onChange={onChange}
                onSubmit={onSubmit}
                placeholder='Type a message and press Enter...'
            />
        </Box>
    )
};