import { BrowserDaemon } from './browser/daemon.js';
import { browserNavigateTool, browserClickTool, browserScreenshotTool, webSearchTool } from './tools/browserTools.js';
import fs from 'node:fs';

async function main() {
    console.log('--- Starting Web Search & Browser Automation Test ---');

    try {
        console.log('\n1. Testing Web Search (Tavily)...');
        const searchResult = await webSearchTool.execute({ query: 'Playwright testing framework github' });
        console.log('Search Response length:', searchResult.content.length);

        console.log('\n2. Testing Browser Navigation...');
        const navResult = await browserNavigateTool.execute({ url: 'https://example.com' });
        console.log('\nARIA Snapshot for example.com:');
        console.log(navResult.content);

        // example.com usually has a 'link "Learn more"' in its ARIA snapshot.
        console.log(`\n3. Testing Browser Click (Role: link, Name: Learn more)...`);
        const clickResult = await browserClickTool.execute({ role: 'link', name: 'Learn more' });
        console.log('\nNew ARIA Snapshot after click:');
        console.log(clickResult.content);

        console.log('\n4. Testing Browser Screenshot...');
        const screenshotResult = await browserScreenshotTool.execute({ savePath: 'test-screenshot.jpeg' });
        
        console.log(screenshotResult.content);

    } catch (e: any) {
        console.error('Test Failed:', e);
    } finally {
        console.log('\nCleaning up daemon...');
        const daemon = BrowserDaemon.getInstance();
        await daemon.close();
        console.log('Done.');
    }
}

main();
