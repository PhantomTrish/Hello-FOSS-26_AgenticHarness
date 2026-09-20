import { createReadFileTool } from "../tools/readFile.js";
import { createWriteFileTool } from "../tools/writeFile.js";
import { AgentEvent, AgentListener, AgentState, AgentStatus, ChatMessage, ChatService } from "../types/chat.js";
import { Tool, ToolCall, ToolResult } from "../types/tool.js";
import { OpenAiChatService } from "./chat.js";

export interface AgentOptions {
    chatService?: ChatService;
    tools?: Tool[];
    systemPrompt?: string;
}

export class Agent {
    private chatService: ChatService;
    private tools: Tool[];
    private messages: ChatMessage[] = [];
    private status: AgentStatus = 'idle';
    private activeToolName?: string;
    private error?: string;
    private listeners: Set<AgentListener> = new Set();

    constructor(options: AgentOptions = {}) {
        this.chatService = options.chatService ?? new OpenAiChatService();
        this.tools = options.tools ?? [];
        if (options.systemPrompt) {
            this.messages.push({ role: 'system', content: options.systemPrompt });
        }
    }

    public getState(): AgentState {
        return {
            messages: [...this.messages],
            status: this.status,
            activeToolName: this.activeToolName,
            error: this.error
        };
    }

    public subscribe(listener: AgentListener): () => void {
        this.listeners.add(listener);
        listener(this.getState());

        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify() {
        const state = this.getState();
        for (const listener of this.listeners) {
            listener(state);
        }
    }

    private setStatus(status: AgentStatus, extra?: { activeToolName?: string; error?: string }) {
        this.status = status;
        this.activeToolName = extra?.activeToolName;
        this.error = extra?.error;
        this.notify();
    }

    private async executeTool(toolCall: ToolCall): Promise<ToolResult> {
        const tool = this.tools.find((t) => t.name === toolCall.name);
        if (!tool) {
            return { content: `Error: Tool "${toolCall.name}" not found.` };
        }

        try {
            return await tool.execute(toolCall.arguments);
        } catch (err: any) {
            return { content: `Error executing "${toolCall.name}": ${err?.message || String(err)}` };
        }
    }

    public async *run(input: string): AsyncGenerator<AgentEvent> {
        const trimmed = input.trim();
        if (!trimmed || this.status === 'thinking' || this.status === 'executing_tool') return;

        const userMessage: ChatMessage = { role: 'user', content: trimmed };
        this.messages.push(userMessage);
        this.setStatus('thinking');

        yield { type: 'message', message: userMessage };
        yield { type: 'status', status: 'thinking' };

        try {
            const MAX_STEPS = 10;
            let step = 0;

            while (step++ < MAX_STEPS) {
                const response = await this.chatService.chat(this.messages, this.tools);

                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: response.content,
                    toolCalls: response.toolCalls,
                    providerMetadata: response.providerMetadata,
                };
                this.messages.push(assistantMessage);
                yield { type: 'message', message: assistantMessage };

                if (!response.toolCalls || response.toolCalls.length === 0) {
                    break;
                }

                for (const toolCall of response.toolCalls) {
                    yield { type: 'tool_call', toolCall };
                    this.setStatus('executing_tool', { activeToolName: toolCall.name });
                    yield { type: 'status', status: 'executing_tool', activeToolName: toolCall.name };

                    const { content, summary } = await this.executeTool(toolCall);

                    const toolMessage: ChatMessage = {
                        role: 'tool',
                        toolCallId: toolCall.id,
                        name: toolCall.name,
                        content: content,
                        summary: summary
                    };
                    this.messages.push(toolMessage);

                    yield { type: 'tool_result', toolCallId: toolCall.id, name: toolCall.name, result: content };
                    yield { type: 'message', message: toolMessage };
                }

                this.setStatus('thinking');
                yield { type: 'status', status: 'thinking' };
            }

            this.setStatus('idle');
            yield { type: 'status', status: 'idle' };
            yield { type: 'done' };
        } catch (err: any) {
            const errorMessage = err?.message || 'Unknown error occurred';
            this.setStatus('error', { error: errorMessage });
            yield { type: 'error', error: errorMessage };
            yield { type: 'status', status: 'error' };
        }
    }

    public async prompt(input: string): Promise<void> {
        for await (const _event of this.run(input)) {
            // Iterates through generator for backward compatibility
        }
    }

}
export function createCodingAgent(projectRoot: string): Agent {
    return new Agent({
        tools: [
            createWriteFileTool(projectRoot),
            createReadFileTool(projectRoot)
        ],
        systemPrompt: "You are WnCC's agentic coding assistant."
    });
}