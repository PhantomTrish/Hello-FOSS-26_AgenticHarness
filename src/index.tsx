import React from 'react';
import { render } from 'ink';
import App from './tui/App.js';
import { Agent, createCodingAgent } from './ai/agent.js';
import { createWriteFileTool } from './tools/writeFile.js';
import { getProjectRoot } from './utils/workspace.js';

async function main() {
    const projectRoot = await getProjectRoot();
    const agent = createCodingAgent(projectRoot);
    await render(<App agent={agent} projectRoot={projectRoot} />);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});