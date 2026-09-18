import { openai, config } from './client.js';
import { ChatMessage, ChatResponse, ChatService } from '../types/chat.js';
import { Tool, ToolCall } from '../types/tool.js';

export class OpenAiChatService implements ChatService {
    async chat(messages: ChatMessage[], tools?: Tool[]): Promise<ChatResponse> {
        const openAiTools = tools?.map((tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        })));

        const response = await openai.chat.completions.create({
            model: config.model,
            messages: messages as any,
            tools: openAiTools?.length ? openAiTools : undefined,
        });

        const choice = response.choices[0];
        if (!choice?.message) {
            throw new Error('No message in response');
        }

        const toolCalls: ToolCall[] | undefined = choice.message.tool_calls
            ?.filter((call) => call.type === 'function')
            .map((call) => ({
                id: call.id,
                name: call.function.name,
                arguments: JSON.parse(call.function.arguments || '{}'),
            }));
        return {
            content: choice.message.content ?? null,
            toolCalls,
        };
    }
}


