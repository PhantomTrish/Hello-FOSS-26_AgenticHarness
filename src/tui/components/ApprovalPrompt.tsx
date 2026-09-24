import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ToolCall } from '../../types/tool.js';
import { ApprovalDecision } from '../../types/chat.js';

interface ApprovalPromptProps {
    toolCall: ToolCall;
    onDecision: (decision: ApprovalDecision) => void;
}

export default function ApprovalPrompt({ toolCall, onDecision }: ApprovalPromptProps) {
    useInput((input, key) => {
        const lower = input.toLowerCase();

        if (lower === 'y' || key.return) {
            onDecision({ approved: true });
        } else if (lower === 'n' || key.escape) {
            onDecision({ approved: false, reason: 'Denied by user' });
        } else if (lower === 'a') {
            onDecision({ approved: true, alwaysAllowSession: true });
        }
    });

    const isCommand = toolCall.name === 'execute_command';
    const commandText = toolCall.arguments?.command || JSON.stringify(toolCall.arguments);
    const cwdText = toolCall.arguments?.cwd;

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} marginY={1}>
            <Box marginBottom={1}>
                <Text bold color="yellow">⚠️  Action Requires User Approval</Text>
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Text color="gray">
                    The assistant wants to execute <Text bold color="white">{toolCall.name}</Text>:
                </Text>

                <Box
                    marginTop={1}
                    paddingX={1}
                    borderStyle="single"
                    borderColor="gray"
                    flexDirection="column"
                >
                    <Text bold color="cyan">
                        {isCommand ? `$ ${commandText}` : commandText}
                    </Text>
                    {cwdText && (
                        <Text dimColor>
                            Working directory: {cwdText}
                        </Text>
                    )}
                </Box>
            </Box>

            <Box flexDirection="row">
                <Text>
                    Press <Text bold color="green">[y / Enter]</Text> Approve |{' '}
                    <Text bold color="red">[n / Esc]</Text> Deny |{' '}
                    <Text bold color="magenta">[a]</Text> Always allow in session
                </Text>
            </Box>
        </Box>
    );
}
