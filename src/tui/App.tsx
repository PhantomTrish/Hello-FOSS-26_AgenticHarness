import React, { useEffect, useMemo, useState } from 'react';
import { Text, Box } from 'ink';
import { ChatMessage } from '../types/chat.js';
import MessageList from './components/MessageList.js';
import { Agent } from '../ai/agent.js';
import { AgentState } from '../types/chat.js';
import ChatInput from './components/ChatInput.js';

interface AppProps {
    agent?: Agent;
}

export default function App({ agent: propAgent }: AppProps) {
    const agent = useMemo(() => propAgent ?? new Agent(), [propAgent]);

    const [agentState, setAgentState] = useState<AgentState>(() => agent.getState());
    const [input, setInput] = useState('');

    useEffect(
        () => {
            const unsubscribe = agent.subscribe(setAgentState);
            return unsubscribe;
        }, [agent]
    );

    const isThinking = agentState.status === 'thinking';
    const handleSubmit = async (submittedText: string) => {
        setInput('');
        await agent.prompt(submittedText);
    };

    return (
        <Box flexDirection='column' padding={1}>
            <Box marginBottom={1}>
                <Text bold color='green'>WnCC Agentic CLI</Text>
            </Box>

            <MessageList messages={agentState.messages} />

            {
                agentState.status === 'error' && (
                    <Box marginBottom={1}>
                        <Text bold color='red'>{agentState.error}</Text>
                    </Box>
                )
            }

            <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                isDisabled={isThinking}
            />
        </Box>
    );
}

