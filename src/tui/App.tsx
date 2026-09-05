import React, { useState } from 'react';
import { Text, Box } from 'ink';
import { ChatMessage } from '../types/chat.js';
import MessageList from './components/MessageList.js';
import { getAiResponse } from '../ai/chat.js';
import ChatInput from './components/ChatInput.js';

export default function App() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        //{ role: 'system', content: 'Talk like the rudest guy out there.' },
        //{ role: 'assistant', content: 'Hey, I\'m WnCC\'s Agentic Coding Assistant. How can I help you?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);



    const handleSubmit = async (submittedText: string) => {
        const trimmed = submittedText.trim();
        if (!trimmed || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: trimmed };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const reply = await getAiResponse(updatedMessages);
            const agentMessage: ChatMessage = { role: 'assistant', content: reply };
            setMessages([...updatedMessages, agentMessage]);
        } catch (error: any) {
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: `Error: ${error?.message || 'Unknown Error occured'}`
            };
            setMessages([...updatedMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <Box flexDirection='column' padding={1}>
            <Box marginBottom={1}>
                <Text bold color='green'>WnCC Agentic CLI</Text>
            </Box>

            <MessageList messages={messages} />

            <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                isDisabled={isLoading}
            />
        </Box>
    );
}

