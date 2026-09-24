import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Tool, ToolResult } from '../types/tool.js';

const MAX_OUTPUT_CHARS = 30_000;
const DEFAULT_TIMEOUT_MS = 60_000;

export interface TerminalArgs {
    command: string;
    cwd?: string;
    timeoutMs?: number;
}

export function createTerminalTool(projectRoot: string): Tool<TerminalArgs> {
    return {
        name: 'execute_command',
        description:
            'Executes a shell command in the project environment and returns its exit code, stdout, and stderr. ' +
            'Use this to run builds, tests, git commands, scripts, or inspect directory contents. ' +
            'Avoid running interactive commands (pass non-interactive flags like -y or -m).',
        requiresApproval: true,
        parameters: {
            type: 'object',
            properties: {
                command: {
                    type: 'string',
                    description: 'The shell command to execute, e.g. "npm test", "git status", "ls -la"',
                },
                cwd: {
                    type: 'string',
                    description: 'Optional working directory relative to project root. Defaults to project root.',
                },
                timeoutMs: {
                    type: 'number',
                    description: 'Optional execution timeout in milliseconds (default: 60000).',
                },
            },
            required: ['command'],
        },
        execute: async ({ command, cwd, timeoutMs = DEFAULT_TIMEOUT_MS }, onChunk?: (chunk: string) => void): Promise<ToolResult> => {
            const trimmedCommand = command?.trim();
            if (!trimmedCommand) {
                return { content: 'Error: No command provided to execute.' };
            }

            // Resolve and validate target working directory
            let targetCwd = projectRoot;
            if (cwd) {
                const resolved = path.resolve(projectRoot, cwd);
                const relative = path.relative(projectRoot, resolved);
                if (relative.startsWith('..') || path.isAbsolute(relative)) {
                    return { content: `Error: cwd "${cwd}" escapes the project root.` };
                }
                if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
                    return { content: `Error: cwd "${cwd}" does not exist or is not a directory.` };
                }
                targetCwd = resolved;
            }

            return new Promise<ToolResult>((resolve) => {
                const isWindows = process.platform === 'win32';
                const shell = isWindows ? 'powershell.exe' : (process.env.SHELL || '/bin/bash');
                const shellArgs = isWindows
                    ? ['-NoProfile', '-NonInteractive', '-Command', trimmedCommand]
                    : ['-c', trimmedCommand];

                let output = '';
                let timedOut = false;

                const proc = spawn(shell, shellArgs, {
                    cwd: targetCwd,
                    // stdio: 'ignore' on stdin immediately signals EOF to prevent hanging on interactive inputs
                    stdio: ['ignore', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        CI: 'true',
                        PAGER: 'cat',
                        GIT_PAGER: 'cat',
                        TERM: 'dumb',
                    },
                });

                const appendChunk = (data: Buffer) => {
                    const text = data.toString('utf-8');
                    output += text;
                    if (onChunk) {
                        try {
                            onChunk(text);
                        } catch {
                            // Ignore callback errors during streaming
                        }
                    }
                };

                proc.stdout?.on('data', appendChunk);
                proc.stderr?.on('data', appendChunk);

                const timeout = setTimeout(() => {
                    timedOut = true;
                    try {
                        proc.kill('SIGTERM');
                    } catch {
                        // Ignore process kill errors
                    }
                    output += `\n[Command timed out after ${timeoutMs / 1000}s]`;
                }, timeoutMs);

                proc.on('close', (code) => {
                    clearTimeout(timeout);

                    let formattedOutput = output.trim();
                    if (formattedOutput.length > MAX_OUTPUT_CHARS) {
                        const head = formattedOutput.slice(0, 10_000);
                        const tail = formattedOutput.slice(-20_000);
                        formattedOutput = `${head}\n\n[...output truncated (${output.length} total chars)...]\n\n${tail}`;
                    }

                    const exitCode = timedOut ? 124 : (code ?? 0);
                    const cwdSuffix = cwd ? ` (in ${cwd})` : '';

                    resolve({
                        content: `Exit Code: ${exitCode}\nOutput:\n${formattedOutput || '(no output)'}`,
                        summary: `$ ${trimmedCommand}${cwdSuffix} [exit: ${exitCode}]`,
                    });
                });

                proc.on('error', (err) => {
                    clearTimeout(timeout);
                    resolve({
                        content: `Failed to spawn command process: ${err.message}`,
                        summary: `$ ${trimmedCommand} [failed to start]`,
                    });
                });
            });
        },
    };
}
