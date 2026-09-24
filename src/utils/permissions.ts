/**
 * Permission and Whitelist Management for Tools & Terminal Commands
 */

// Disallow any command that contains shell chaining, pipes, or redirection operators from being auto-approved.
const SHELL_OPERATOR_REGEX = /[;&|`$><\r\n]/;

// Safe read-only command prefixes that can be auto-approved if no chaining operators are present.
const SAFE_READONLY_PREFIXES = [
    'git status',
    'git diff',
    'git log',
    'git branch',
    'git show',
    'git remote',
    'git rev-parse',
    'dir',
    'ls',
    'pwd',
    'echo',
    'cat',
    'node -v',
    'node --version',
    'npm -v',
    'npm --version',
    'tsc --version',
    'python --version',
    'python -V',
    'python3 --version',
];

/**
 * Checks if a shell command contains chaining, redirection, or expansion operators.
 */
export function hasShellChainingOrRedirection(command: string): boolean {
    return SHELL_OPERATOR_REGEX.test(command);
}

/**
 * Checks if a command is inherently safe to run without user confirmation.
 */
export function isSafeReadOnlyCommand(command: string): boolean {
    const trimmed = command.trim();
    if (!trimmed) return false;

    // Any chaining or redirection immediately disqualifies from auto-whitelist
    if (hasShellChainingOrRedirection(trimmed)) {
        return false;
    }

    const lower = trimmed.toLowerCase();
    return SAFE_READONLY_PREFIXES.some((prefix) => {
        return lower === prefix || lower.startsWith(prefix + ' ');
    });
}

/**
 * Manages runtime and session permission policies.
 */
export class SessionPermissionManager {
    private alwaysAllowSession = false;
    private allowedCommands = new Set<string>();

    /**
     * Checks if a tool call is permitted without prompting.
     */
    public isPermitted(toolName: string, args: Record<string, any> = {}): boolean {
        if (this.alwaysAllowSession) {
            return true;
        }

        if (toolName === 'execute_command') {
            const command = typeof args.command === 'string' ? args.command.trim() : '';
            if (!command) return false;

            // Check if explicitly allowed for session
            if (this.allowedCommands.has(command)) {
                return true;
            }

            // Check if safe read-only command
            return isSafeReadOnlyCommand(command);
        }

        return false;
    }

    /**
     * Whitelist all actions for this session.
     */
    public grantAlwaysAllowSession(): void {
        this.alwaysAllowSession = true;
    }

    /**
     * Whitelist a specific command for this session.
     */
    public grantCommand(command: string): void {
        this.allowedCommands.add(command.trim());
    }

    /**
     * Reset session permissions.
     */
    public reset(): void {
        this.alwaysAllowSession = false;
        this.allowedCommands.clear();
    }
}
