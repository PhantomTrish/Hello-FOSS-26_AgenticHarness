import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    clearSession,
    getSessionPath,
    loadSession,
    resolveInitialMessages,
    saveSession,
} from './session.js';
import { ChatMessage } from '../types/chat.js';

function createTempProjectRoot(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'harness-session-test-'));
}

test('saveSession and loadSession persist and restore valid messages', () => {
    const tmpDir = createTempProjectRoot();
    try {
        const sampleMessages: ChatMessage[] = [
            { role: 'system', content: 'System prompt' },
            { role: 'user', content: 'Hello harness' },
            { role: 'assistant', content: 'Hi! How can I help?' },
        ];

        saveSession(tmpDir, sampleMessages);
        const loaded = loadSession(tmpDir);
        assert.deepEqual(loaded, sampleMessages);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('loadSession warns and returns empty array when session file is missing or empty', () => {
    const tmpDir = createTempProjectRoot();
    try {
        assert.deepEqual(loadSession(tmpDir), []);

        fs.writeFileSync(getSessionPath(tmpDir), '   ', 'utf-8');
        assert.deepEqual(loadSession(tmpDir), []);

        saveSession(tmpDir, [{ role: 'system', content: 'System prompt only' }]);
        assert.deepEqual(loadSession(tmpDir), []);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('loadSession handles corrupted JSON and filters malformed messages safely', () => {
    const tmpDir = createTempProjectRoot();
    try {
        fs.writeFileSync(getSessionPath(tmpDir), '{corrupted json', 'utf-8');
        assert.deepEqual(loadSession(tmpDir), []);

        fs.writeFileSync(
            getSessionPath(tmpDir),
            JSON.stringify([
                null,
                { invalid: true },
                { role: 'user', content: 'Valid user prompt' },
            ]),
            'utf-8',
        );
        const loaded = loadSession(tmpDir);
        assert.equal(loaded.length, 1);
        assert.equal(loaded[0].role, 'user');
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('clearSession removes existing .harness-session.json file', () => {
    const tmpDir = createTempProjectRoot();
    try {
        saveSession(tmpDir, [{ role: 'user', content: 'Test message' }]);
        assert.equal(fs.existsSync(getSessionPath(tmpDir)), true);

        assert.equal(clearSession(tmpDir), true);
        assert.equal(fs.existsSync(getSessionPath(tmpDir)), false);

        assert.equal(clearSession(tmpDir), false);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});

test('resolveInitialMessages handles --resume, -r, --new-session, and default args without side effects', () => {
    const tmpDir = createTempProjectRoot();
    try {
        const sampleMessages: ChatMessage[] = [
            { role: 'user', content: 'Resume me' },
            { role: 'assistant', content: 'Resumed!' },
        ];
        saveSession(tmpDir, sampleMessages);

        // Default (no flags): starts fresh without deleting existing session file
        assert.equal(resolveInitialMessages(tmpDir, []), undefined);
        assert.equal(fs.existsSync(getSessionPath(tmpDir)), true);

        // --resume and -r: restores saved messages
        assert.deepEqual(resolveInitialMessages(tmpDir, ['--resume']), sampleMessages);
        assert.deepEqual(resolveInitialMessages(tmpDir, ['-r']), sampleMessages);

        // --new-session: deletes session file and returns undefined
        assert.equal(resolveInitialMessages(tmpDir, ['--new-session']), undefined);
        assert.equal(fs.existsSync(getSessionPath(tmpDir)), false);

        // --resume when no session exists: warns and returns undefined
        assert.equal(resolveInitialMessages(tmpDir, ['--resume']), undefined);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});
