import React from 'react';
import { render } from 'ink';
import App from './tui/App.js';
import { createCodingAgent } from './ai/agent.js';
import { getProjectRoot } from './utils/workspace.js';
import { BrowserDaemon } from './browser/daemon.js';
import { resolveInitialMessages } from './ai/session.js';
import { createRequire } from 'node:module';
import { loadSession } from './ai/session.js';

const help = `
Usage: coding-harness [options] [project-directory]

Options:
  -d, --dir <path>   Project directory
  --headed           Run the browser in headed mode (default: headless)
  -h, --help         Show this help
  -v, --version      Show version
`;

function hasFlag(...flags: string[]): boolean {
    return flags.some((flag) => process.argv.includes(flag));
}

const require = createRequire(import.meta.url);
function getVersion(): string {
    const packageJson = require('../package.json');
    return packageJson.version;
}

async function main() {
    if (hasFlag('-h', '--help')) {
        console.log(help);
        process.exit(0);
    }

    if (hasFlag('-v', '--version')) {
        console.log(getVersion());
        process.exit(0);
    }

    const args = process.argv.slice(2);
    const isHeaded = args.includes('--headed');
    BrowserDaemon.getInstance({ headless: !isHeaded });

    const projectRoot = await getProjectRoot();
    const initialMessages = resolveInitialMessages(projectRoot, args);
    const agent = createCodingAgent(projectRoot, initialMessages);
    await render(<App agent={agent} projectRoot={projectRoot} />, { exitOnCtrlC: false });
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
