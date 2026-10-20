import React from 'react';
import { Loading } from './Loading.js';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
    isDisabled?: boolean;
    statusText?: string;
}

export default function ChatInput({ value, onChange, onSubmit, isDisabled = false, statusText }: ChatInputProps) {
    if (isDisabled) {
        return (
            <Box>
                <Loading text={statusText || 'Thinking...'} />
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
    );
}