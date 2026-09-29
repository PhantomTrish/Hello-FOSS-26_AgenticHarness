import fs from 'node:fs';
import path from 'node:path';
import { ChatMessage } from '../types/chat.js';

const SESSION_FILENAME = '.harness-session.json';

function getSessionPath(projectRoot: string): string {
    return path.join(projectRoot, SESSION_FILENAME);
}

export function loadSession(projectRoot: string): ChatMessage[] {
    const sessionPath = getSessionPath(projectRoot);
    try {
        if (fs.existsSync(sessionPath)) {
            const raw = fs.readFileSync(sessionPath, 'utf-8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as ChatMessage[];
            }
        }
    } catch (err) {
        console.warn('Could not load previous session, starting fresh:', (err as Error).message);
    }
    return [];
}

export function saveSession(projectRoot: string, messages: ChatMessage[]): void {
    const sessionPath = getSessionPath(projectRoot);
    try {
        fs.writeFileSync(sessionPath, JSON.stringify(messages, null, 2), 'utf-8');
    } catch (err) {
        console.warn('Could not save session:', (err as Error).message);
    }
}
