import { openai, config } from './client.js';
import { ChatMessage, ChatResponse, ChatService } from '../types/chat.js';
import { Tool, ToolCall } from '../types/tool.js';

export interface OpenAiChatServiceOptions {
    bypassThoughtSignature?: boolean;
}

export class OpenAiChatService implements ChatService {
    private bypassThoughtSignature: boolean;

    constructor(options: OpenAiChatServiceOptions = {}) {
        // Toggle for Google's thought_signature requirement; can be set via options or client config
        this.bypassThoughtSignature = options.bypassThoughtSignature ?? config.bypassThoughtSignature ?? false;
    }

    async chat(messages: ChatMessage[], tools?: Tool[]): Promise<ChatResponse> {
        const openAiTools = tools?.map((tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        })));

        const openAiMessages = messages.map((msg) => {
            switch (msg.role) {
                case 'user':
                case 'system':
                    return {
                        role: msg.role,
                        content: msg.content,
                    };
                case 'assistant':
                    return {
                        role: 'assistant' as const,
                        content: msg.content ?? null,
                        ...(msg.providerMetadata ?? {}),
                        // Reconstruct OpenAI wire format for tool_calls initiated in previous turns
                        tool_calls: msg.toolCalls?.length
                            ? msg.toolCalls.map((tc) => {
                                // Separate function-scoped metadata from top-level call metadata
                                const { functionExtra, ...callExtra } = tc.providerMetadata ?? {};

                                return {
                                    id: tc.id,
                                    type: 'function' as const,
                                    function: {
                                        name: tc.name,
                                        arguments: JSON.stringify(tc.arguments),
                                        ...(functionExtra ?? {}),
                                    },
                                    // Gemini Thinking Guard:
                                    // In Gemini 2.5/3.0, missing thought signatures on multi-turn tool calls trigger a 400 error.
                                    // If toggled on and no signature was captured from the provider, inject Google's official bypass token.
                                    ...(this.bypassThoughtSignature && !tc.providerMetadata?.thought_signature
                                        ? { thought_signature: 'skip_thought_signature_validator' }
                                        : {}),
                                    ...callExtra,
                                };
                            })
                            : undefined,
                    };
                case 'tool':
                    return {
                        role: 'tool' as const,
                        tool_call_id: msg.toolCallId,
                        content: msg.content,
                    };
            }
        });

        const response = await openai.chat.completions.create({
            model: config.model,
            messages: openAiMessages as any,
            tools: openAiTools?.length ? openAiTools : undefined,
        });

        const choice = response.choices[0];
        if (!choice?.message) {
            throw new Error('No message in response');
        }

        const rawMessage = choice.message as any;
        const { role: _r, content: _c, tool_calls: _tc, ...messageExtra } = rawMessage;

        const toolCalls: ToolCall[] | undefined = choice.message.tool_calls
            ?.filter((call) => call.type === 'function')
            .map((call) => {
                const { id, type, function: fn, ...callExtra } = call as any;
                const { name, arguments: args, ...fnExtra } = fn || {};

                const providerMetadata: Record<string, any> = {
                    ...callExtra,
                };
                if (Object.keys(fnExtra).length > 0) {
                    providerMetadata.functionExtra = fnExtra;
                }

                return {
                    id: call.id,
                    name: call.function.name,
                    arguments: JSON.parse(call.function.arguments || '{}'),
                    providerMetadata: Object.keys(providerMetadata).length ? providerMetadata : undefined,
                };
            });

        return {
            content: choice.message.content ?? null,
            toolCalls,
            providerMetadata: Object.keys(messageExtra).length ? messageExtra : undefined,
        };
    }
}


