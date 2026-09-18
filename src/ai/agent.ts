import { AgentListener, AgentState, AgentStatus, ChatMessage, ChatService } from "../types/chat.js";
import { Tool } from "../types/tool.js";
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

    private setStatus(status: AgentStatus, error?: string) {
        this.status = status;
        this.error = error;
        this.notify();
    }

    public async prompt(input: string): Promise<void> {
        const trimmed = input.trim();
        if (!trimmed || this.status === 'thinking') return;

        this.messages.push({ role: 'user', content: trimmed });
        this.setStatus('thinking');

        try {
            const response = await this.chatService.chat(this.messages, this.tools);

            if (response.content) {
                this.messages.push({ role: 'assistant', content: response.content });
            }

            this.setStatus('idle');
        } catch (err: any) {
            this.setStatus('error', err?.message || 'Unknown error occured');
        }
    }
}