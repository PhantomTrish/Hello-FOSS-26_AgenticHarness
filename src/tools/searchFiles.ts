import path from 'node:path';
import fs from 'node:fs';
import { Tool, ToolResult } from '../types/tool.js';

interface SearchFilesArgs {
    query: string;
    path?: string;
    filePattern?: string;
    caseSensitive?: boolean;
    maxResults?: number;
}

const IGNORED_DIRECTORIES = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
]);

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const DEFAULT_MAX_RESULTS = 50;
const MAX_RESULTS = 200;

function matchesFilePattern(fileName: string, pattern?: string): boolean {
    if (!pattern) return true;

    // Support the common patterns useful for a coding agent, such as *.ts, *.tsx and package.json.
    if (pattern.startsWith('*.')) {
        return fileName.endsWith(pattern.slice(1));
    }

    return fileName === pattern;
}

function looksBinary(buffer: Buffer): boolean {
    // A NUL byte is a reliable enough signal for the text-file search use case.
    return buffer.includes(0);
}

export function createSearchFilesTool(projectRoot: string): Tool<SearchFilesArgs> {
    return {
        name: 'search_files',
        description:
            'Searches project files for a text pattern and returns matching file paths, line numbers, and matching lines. Use this to locate functions, variables, imports, TODOs, or other code before reading or editing files.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The text to search for in project files.',
                },
                path: {
                    type: 'string',
                    description:
                        'Optional relative file or directory to search inside. Defaults to the project root.',
                },
                filePattern: {
                    type: 'string',
                    description:
                        'Optional file-name pattern, for example "*.ts", "*.tsx", or "package.json".',
                },
                caseSensitive: {
                    type: 'boolean',
                    description: 'Whether the search should be case-sensitive. Defaults to false.',
                },
                maxResults: {
                    type: 'integer',
                    description: `Maximum number of matching lines to return. Defaults to ${DEFAULT_MAX_RESULTS}, maximum ${MAX_RESULTS}.`,
                },
            },
            required: ['query'],
        },
        execute: async ({
            query,
            path: searchPath,
            filePattern,
            caseSensitive = false,
            maxResults = DEFAULT_MAX_RESULTS,
        }): Promise<ToolResult> => {
            try {
                if (!query?.trim()) {
                    return { content: 'Error: query cannot be empty.' };
                }

                const normalizedMaxResults = Math.min(
                    Math.max(1, Math.floor(maxResults || DEFAULT_MAX_RESULTS)),
                    MAX_RESULTS,
                );

                const resolvedStart = path.resolve(projectRoot, searchPath || '.');
                const projectRootWithSeparator = projectRoot.endsWith(path.sep)
                    ? projectRoot
                    : `${projectRoot}${path.sep}`;

                if (
                    resolvedStart !== projectRoot &&
                    !resolvedStart.startsWith(projectRootWithSeparator)
                ) {
                    return { content: 'Error: search path must stay inside the project directory.' };
                }

                if (!fs.existsSync(resolvedStart)) {
                    return {
                        content: `Error: Search path "${searchPath || '.'}" does not exist.`,
                    };
                }

                const stat = fs.statSync(resolvedStart);
                const results: string[] = [];
                const needle = caseSensitive ? query : query.toLowerCase();
                let filesScanned = 0;
                let truncated = false;

                const searchFile = (filePath: string) => {
                    if (results.length >= normalizedMaxResults) {
                        truncated = true;
                        return;
                    }

                    const fileName = path.basename(filePath);
                    if (!matchesFilePattern(fileName, filePattern)) return;

                    try {
                        const fileStat = fs.statSync(filePath);
                        if (!fileStat.isFile() || fileStat.size > MAX_FILE_SIZE) return;

                        const buffer = fs.readFileSync(filePath);
                        if (looksBinary(buffer)) return;

                        filesScanned++;
                        const content = buffer.toString('utf-8');
                        const lines = content.split(/\r?\n/);
                        const relativePath = path.relative(projectRoot, filePath) || fileName;

                        for (let index = 0; index < lines.length; index++) {
                            if (results.length >= normalizedMaxResults) {
                                truncated = true;
                                break;
                            }

                            const line = lines[index];
                            const haystack = caseSensitive ? line : line.toLowerCase();
                            if (haystack.includes(needle)) {
                                results.push(`${relativePath}:${index + 1}: ${line}`);
                            }
                        }
                    } catch {
                        // Ignore files that cannot be read and continue searching the project.
                    }
                };

                const walk = (directory: string) => {
                    if (results.length >= normalizedMaxResults) {
                        truncated = true;
                        return;
                    }

                    let entries: fs.Dirent[];
                    try {
                        entries = fs.readdirSync(directory, { withFileTypes: true });
                    } catch {
                        return;
                    }

                    entries.sort((a, b) => a.name.localeCompare(b.name));

                    for (const entry of entries) {
                        if (results.length >= normalizedMaxResults) {
                            truncated = true;
                            return;
                        }

                        if (entry.isDirectory()) {
                            if (IGNORED_DIRECTORIES.has(entry.name)) continue;
                            walk(path.join(directory, entry.name));
                        } else if (entry.isFile()) {
                            searchFile(path.join(directory, entry.name));
                        }
                    }
                };

                if (stat.isDirectory()) {
                    if (IGNORED_DIRECTORIES.has(path.basename(resolvedStart))) {
                        return {
                            content: `No files searched: "${searchPath || '.'}" is an ignored directory.`,
                        };
                    }
                    walk(resolvedStart);
                } else if (stat.isFile()) {
                    searchFile(resolvedStart);
                } else {
                    return { content: 'Error: search path is not a regular file or directory.' };
                }

                const scope = searchPath || '.';
                const header = `Search results for "${query}" in ${scope}${filePattern ? ` (${filePattern})` : ''}`;

                if (results.length === 0) {
                    return {
                        content: `${header}\nNo matches found. Files scanned: ${filesScanned}.`,
                        summary: `No matches for "${query}"`,
                    };
                }

                const suffix = truncated
                    ? `\n\nResults truncated at ${normalizedMaxResults} matches. Narrow the search with path or filePattern for more precise results.`
                    : '';

                return {
                    content: `${header}\n${results.join('\n')}${suffix}`,
                    summary: `${results.length} match${results.length === 1 ? '' : 'es'} for "${query}"`,
                };
            } catch (error: any) {
                return { content: `Error searching files: ${error?.message || String(error)}` };
            }
        },
    };
}
