// this file is completely vibecoded, idk the implementation, i only care about the use. - Mrp1Dev
import React from 'react';
import { Box, Text } from 'ink';
import { marked, type Token, type Tokens } from 'marked';

interface MarkdownProps {
    children: string;
}

function renderInline(tokens?: Token[]): React.ReactNode {
    if (!tokens || tokens.length === 0) return null;

    return tokens.map((token, index) => {
        const key = `inline-${token.type}-${index}`;
        switch (token.type) {
            case 'text':
            case 'escape': {
                const textToken = token as Tokens.Text | Tokens.Escape;
                if ('tokens' in textToken && textToken.tokens && textToken.tokens.length > 0) {
                    return <React.Fragment key={key}>{renderInline(textToken.tokens)}</React.Fragment>;
                }
                return <Text key={key}>{textToken.text}</Text>;
            }
            case 'strong': {
                const strongToken = token as Tokens.Strong;
                return (
                    <Text key={key} bold>
                        {renderInline(strongToken.tokens)}
                    </Text>
                );
            }
            case 'em': {
                const emToken = token as Tokens.Em;
                return (
                    <Text key={key} italic dimColor>
                        {renderInline(emToken.tokens)}
                    </Text>
                );
            }
            case 'codespan': {
                const codespanToken = token as Tokens.Codespan;
                return (
                    <Text key={key} color="yellow">
                        {` ${codespanToken.text} `}
                    </Text>
                );
            }
            case 'del': {
                const delToken = token as Tokens.Del;
                return (
                    <Text key={key} strikethrough dimColor>
                        {renderInline(delToken.tokens)}
                    </Text>
                );
            }
            case 'link': {
                const linkToken = token as Tokens.Link;
                return (
                    <Text key={key} underline color="blue">
                        {renderInline(linkToken.tokens)}
                        <Text dimColor>{` (${linkToken.href})`}</Text>
                    </Text>
                );
            }
            case 'image': {
                const imageToken = token as Tokens.Image;
                return (
                    <Text key={key} dimColor>
                        {`[Image: ${imageToken.title || imageToken.text || imageToken.href}]`}
                    </Text>
                );
            }
            case 'br':
                return <Text key={key}>{'\n'}</Text>;
            default:
                if ('tokens' in token && (token as any).tokens) {
                    return <React.Fragment key={key}>{renderInline((token as any).tokens)}</React.Fragment>;
                }
                if ('text' in token) {
                    return <Text key={key}>{(token as any).text}</Text>;
                }
                return null;
        }
    });
}

function renderBlock(token: Token, index: number): React.ReactNode {
    const key = `block-${token.type}-${index}`;

    switch (token.type) {
        case 'heading': {
            const headingToken = token as Tokens.Heading;
            const content = renderInline(headingToken.tokens);
            switch (headingToken.depth) {
                case 1:
                    return (
                        <Box key={key} marginTop={1} marginBottom={0}>
                            <Text bold color="magenta">
                                {content}
                            </Text>
                        </Box>
                    );
                case 2:
                    return (
                        <Box key={key} marginTop={1} marginBottom={0}>
                            <Text bold color="cyan">
                                {content}
                            </Text>
                        </Box>
                    );
                case 3:
                    return (
                        <Box key={key} marginTop={1} marginBottom={0}>
                            <Text bold color="green">
                                {content}
                            </Text>
                        </Box>
                    );
                default:
                    return (
                        <Box key={key} marginTop={1} marginBottom={0}>
                            <Text bold color="yellow">
                                {content}
                            </Text>
                        </Box>
                    );
            }
        }

        case 'paragraph': {
            const paragraphToken = token as Tokens.Paragraph;
            return (
                <Box key={key} marginBottom={0}>
                    <Text>{renderInline(paragraphToken.tokens)}</Text>
                </Box>
            );
        }

        case 'code': {
            const codeToken = token as Tokens.Code;
            return (
                <Box
                    key={key}
                    flexDirection="column"
                    marginY={1}
                    paddingLeft={2}
                    borderStyle="single"
                    borderLeft
                    borderTop={false}
                    borderRight={false}
                    borderBottom={false}
                    borderColor="gray"
                >
                    {codeToken.lang && (
                        <Text dimColor italic>
                            {`[${codeToken.lang}]`}
                        </Text>
                    )}
                    <Text color="green">{codeToken.text}</Text>
                </Box>
            );
        }

        case 'blockquote': {
            const bqToken = token as Tokens.Blockquote;
            return (
                <Box
                    key={key}
                    paddingLeft={2}
                    marginY={0}
                    borderStyle="single"
                    borderLeft
                    borderTop={false}
                    borderRight={false}
                    borderBottom={false}
                    borderColor="blue"
                    flexDirection="column"
                >
                    {bqToken.tokens?.map((t, idx) => renderBlock(t, idx))}
                </Box>
            );
        }

        case 'list': {
            const listToken = token as Tokens.List;
            const startNum = typeof listToken.start === 'number' ? listToken.start : 1;

            return (
                <Box key={key} flexDirection="column" marginBottom={0}>
                    {listToken.items.map((item, itemIdx) => {
                        const bullet = listToken.ordered ? `${startNum + itemIdx}. ` : '● ';
                        return (
                            <Box key={`${key}-item-${itemIdx}`} paddingLeft={1} flexDirection="row">
                                <Text color="cyan">{bullet}</Text>
                                <Box flexDirection="column" flexGrow={1}>
                                    {item.tokens.map((itToken, itIdx) => {
                                        if (itToken.type === 'text' || itToken.type === 'paragraph') {
                                            const sub = (itToken as any).tokens;
                                            return (
                                                <Text key={`${key}-it-${itemIdx}-${itIdx}`}>
                                                    {sub ? renderInline(sub) : (itToken as any).text}
                                                </Text>
                                            );
                                        }
                                        return renderBlock(itToken, itIdx);
                                    })}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            );
        }

        case 'hr':
            return (
                <Box key={key} marginY={0}>
                    <Text dimColor>{'─'.repeat(40)}</Text>
                </Box>
            );

        case 'table': {
            const tableToken = token as Tokens.Table;
            return (
                <Box key={key} flexDirection="column" marginY={1}>
                    <Box flexDirection="row">
                        {tableToken.header.map((cell, cIdx) => (
                            <Box key={`th-${cIdx}`} paddingRight={2}>
                                <Text bold color="cyan">
                                    {renderInline(cell.tokens)}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                    <Text dimColor>{'─'.repeat(40)}</Text>
                    {tableToken.rows.map((row, rIdx) => (
                        <Box key={`tr-${rIdx}`} flexDirection="row">
                            {row.map((cell, cIdx) => (
                                <Box key={`td-${rIdx}-${cIdx}`} paddingRight={2}>
                                    <Text>{renderInline(cell.tokens)}</Text>
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            );
        }

        case 'space':
            return null;

        default:
            if ('text' in token) {
                return (
                    <Box key={key}>
                        <Text>{(token as any).text}</Text>
                    </Box>
                );
            }
            return null;
    }
}

function Markdown({ children }: MarkdownProps) {
    if (!children) return null;

    const trimmed = children.trim();
    if (!trimmed) return null;

    const tokens = marked.lexer(trimmed);

    return (
        <Box flexDirection="column">
            {tokens.map((token, index) => renderBlock(token, index))}
        </Box>
    );
}

export default React.memo(Markdown);
