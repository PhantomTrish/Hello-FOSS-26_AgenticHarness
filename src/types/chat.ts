import { Tool, ToolCall } from "./tool.js";

export type Role = 'user' | 'assistant' | 'system';
export type AgentStatus = 'idle' | 'thinking' | 'error';

export interface ChatMessage {
    role: Role;
    content: string;
}

export interface ChatResponse {
    content: string | null;
    toolCalls?: ToolCall[];
}

export interface ChatService {
    chat(messages: ChatMessage[], tools?: Tool[]): Promise<ChatResponse>;
}

export interface AgentState {
    messages: ChatMessage[];
    status: AgentStatus;
    error?: string;
}

export type AgentListener = (state: AgentState) => void;