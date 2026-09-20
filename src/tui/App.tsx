import React, { useMemo, useState } from 'react';
import { Text, Box } from 'ink';
import { AgentStatus, ChatMessage } from '../types/chat.js';
import MessageList from './components/MessageList.js';
import { Agent } from '../ai/agent.js';
import ChatInput from './components/ChatInput.js';

interface AppProps {
    agent?: Agent;
    projectRoot?: string;
}

export default function App({ agent: propAgent, projectRoot }: AppProps) {
    const agent = useMemo(() => propAgent ?? new Agent(), [propAgent]);

    const [messages, setMessages] = useState<ChatMessage[]>(() => agent.getState().messages);
    const [status, setStatus] = useState<AgentStatus>('idle');
    const [activeToolName, setActiveToolName] = useState<string | undefined>();
    const [error, setError] = useState<string | undefined>();
    const [input, setInput] = useState('');

    const isBusy = status === 'thinking' || status === 'executing_tool';
    const statusText = status === 'executing_tool'
        ? `Running ${activeToolName || 'tool'}...`
        : 'Thinking...';

    const handleSubmit = async (submittedText: string) => {
        setInput('');
        setError(undefined);

        for await (const event of agent.run(submittedText)) {
            switch (event.type) {
                case 'message':
                    setMessages((prev) => [...prev, event.message]);
                    break;
                case 'status':
                    setStatus(event.status);
                    setActiveToolName(event.activeToolName);
                    break;
                case 'error':
                    setError(event.error);
                    break;
            }
        }
    };

    return (
        <Box flexDirection='column' paddingX={1}>
            <MessageList messages={messages} projectRoot={projectRoot} />

            {error && (
                <Box marginBottom={1}>
                    <Text bold color='red'>{error}</Text>
                </Box>
            )}

            <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                isDisabled={isBusy}
                statusText={statusText}
            />
        </Box>
    );
}

