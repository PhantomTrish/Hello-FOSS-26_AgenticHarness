export interface Tool<TArgs = any> {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    }

    requiresApproval?: boolean | ((args: TArgs) => boolean);
    execute: (
        args: TArgs,
        onChunk?: (chunk: string) => void,
        signal?: AbortSignal
    ) => Promise<ToolResult> | ToolResult;
}

export interface ToolResult {
    content: string;
    summary?: string;
    // Line counts for file edits, so the TUI can show "+12 -4" without re-reading the file.
    added?: number;
    removed?: number;
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
    providerMetadata?: Record<string, any>;
}