import React from 'react';
import { render } from 'ink';
import App from './tui/App.js';
import { createCodingAgent } from './ai/agent.js';
import { getProjectRoot } from './utils/workspace.js';
import { BrowserDaemon } from './browser/daemon.js';
import { resolveInitialMessages } from './ai/session.js';

async function main() {
    const args = process.argv.slice(2);
    const isHeaded = args.includes('--headed');
    BrowserDaemon.getInstance({ headless: !isHeaded });

    const projectRoot = await getProjectRoot();
    const initialMessages = resolveInitialMessages(projectRoot, args);
    const agent = createCodingAgent(projectRoot, initialMessages);
    await render(<App agent={agent} projectRoot={projectRoot} />);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
