export interface Tool<TArgs = any> {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    }

    execute: (args: TArgs) => Promise<string> | string;
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
    providerMetadata?: Record<string, any>;
}