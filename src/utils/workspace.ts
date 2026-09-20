import path from "node:path";
import { parseArgs } from "node:util";
import fs from 'node:fs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
export async function getProjectRoot(): Promise<string> {
    const { values, positionals } = parseArgs({
        options: {
            dir: {
                type: 'string',
                short: 'd'
            },
        },
        allowPositionals: true,
        strict: false
    });

    const rawPath = (values.dir || positionals[0]) as string;

    if (rawPath) {
        const resolved = path.resolve(process.cwd(), rawPath);
        if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
            return resolved;
        }
        console.warn(`Warning: "${rawPath}" is not a valid directory. Falling back to prompt.\n`);
    }

    const rl = readline.createInterface({ input, output });
    try {
        while (true) {
            const answer = await rl.question('Enter project directory (default: current dir): ');
            const target = answer.trim() || '.';
            const resolved = path.resolve(process.cwd(), target);
            if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
                return resolved;
            }
            console.warn(`Error: "${target}" is not a valid directory. Try again.`);
        }
    } finally {
        rl.close();
        process.stdin.resume();
    }
}