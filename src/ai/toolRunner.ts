import { Tool, ToolCall, ToolResult } from '../types/tool.js';

/**
 * Handles tool lookup, execution, and error containment.
 */
export class ToolRunner {
    constructor(private tools: Tool[] = []) {}

    public getTool(name: string): Tool | undefined {
        return this.tools.find((t) => t.name === name);
    }

    public async execute(
        toolCall: ToolCall,
        onChunk?: (chunk: string) => void
    ): Promise<ToolResult> {
        const tool = this.getTool(toolCall.name);
        if (!tool) {
            return { content: `Error: Tool "${toolCall.name}" not found.` };
        }

        try {
            return await tool.execute(toolCall.arguments, onChunk);
        } catch (err: any) {
            return { content: `Error executing "${toolCall.name}": ${err?.message || String(err)}` };
        }
    }
}
