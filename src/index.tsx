import React from 'react';
import { render } from 'ink';
import App from './tui/App.js';
import { Agent } from './ai/agent.js';
import { writeFileTool } from './tools/writeFile.js';

const agent = new Agent({
    tools: [writeFileTool],
    systemPrompt: "You are WnCC's agentic coding assistant.",
});

render(<App agent={agent} />);
