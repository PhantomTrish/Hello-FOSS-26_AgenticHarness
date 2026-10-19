import fs from 'node:fs';
import path from 'node:path';
import { ChatMessage } from '../types/chat.js';

const SESSION_FILENAME = '.harness-session.json';
const VALID_ROLES = new Set(['user', 'assistant', 'system', 'tool']);

export function getSessionPath(projectRoot: string): string {
    return path.join(projectRoot, SESSION_FILENAME);
}

export function isValidChatMessage(msg: unknown): msg is ChatMessage {
    if (!msg || typeof msg !== 'object') return false;
    const candidate = msg as Record<string, unknown>;

    if (typeof candidate.role !== 'string' || !VALID_ROLES.has(candidate.role)) {
        return false;
    }

    if (candidate.role === 'assistant') {
        return typeof candidate.content === 'string' || candidate.content === null;
    }

    if (candidate.role === 'tool') {
        return (
            typeof candidate.content === 'string' &&
            typeof candidate.toolCallId === 'string' &&
            typeof candidate.name === 'string'
        );
    }

    return typeof candidate.content === 'string';
}

export function loadSession(projectRoot: string): ChatMessage[] {
    const sessionPath = getSessionPath(projectRoot);
    try {
        if (!fs.existsSync(sessionPath)) {
            console.warn('No saved session found (.harness-session.json), starting a fresh session.');
            return [];
        }

        const raw = fs.readFileSync(sessionPath, 'utf-8').trim();
        if (!raw) {
            console.warn('Saved session file is empty, starting a fresh session.');
            return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            console.warn('Saved session format is invalid, starting a fresh session.');
            return [];
        }

        const validMessages = parsed.filter(isValidChatMessage);
        const hasConversation = validMessages.some((msg) => msg.role !== 'system');
        if (validMessages.length === 0 || !hasConversation) {
            console.warn('Saved session contains no valid conversation messages, starting a fresh session.');
            return [];
        }

        return validMessages;
    } catch (err) {
        console.warn('Could not load previous session, starting fresh:', (err as Error).message);
        return [];
    }
}

export function saveSession(projectRoot: string, messages: ChatMessage[]): void {
    const sessionPath = getSessionPath(projectRoot);
    try {
        fs.writeFileSync(sessionPath, JSON.stringify(messages, null, 2), 'utf-8');
    } catch (err) {
        console.warn('Could not save session:', (err as Error).message);
    }
}

export function clearSession(projectRoot: string): boolean {
    const sessionPath = getSessionPath(projectRoot);
    try {
        if (fs.existsSync(sessionPath)) {
            fs.unlinkSync(sessionPath);
            return true;
        }
    } catch (err) {
        console.warn('Could not clear session:', (err as Error).message);
    }
    return false;
}

export function resolveInitialMessages(
    projectRoot: string,
    args: string[] = process.argv.slice(2),
): ChatMessage[] | undefined {
    const isNewSession = args.includes('--new-session');
    const isResume = args.includes('--resume') || args.includes('-r');

    if (isNewSession) {
        clearSession(projectRoot);
        return undefined;
    }

    if (isResume) {
        const messages = loadSession(projectRoot);
        return messages.length > 0 ? messages : undefined;
    }

    return undefined;
}
