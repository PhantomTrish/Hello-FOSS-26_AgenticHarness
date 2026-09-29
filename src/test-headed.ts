import { BrowserDaemon } from './browser/daemon.js';
import { browserNavigateTool, browserScreenshotTool } from './tools/browserTools.js';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
    console.log('--- Starting Headful Browser Automation Test ---');

    // Initialize daemon explicitly in headed mode
    BrowserDaemon.getInstance({ headless: false });

    try {
        console.log('\n1. Testing Browser Navigation...');
        const navResult = await browserNavigateTool.execute({ url: 'https://wttr.in' });
        console.log('\nNavigation complete.');

        console.log('\n2. Testing Guaranteed Screenshot to Disk...');
        const testFilename = 'test-wttr.png';
        const screenshotResult = await browserScreenshotTool.execute({ filename: testFilename });
        
        console.log('\nScreenshot Result:', screenshotResult.content);

        // Verify the file exists
        const screenshotsDir = path.resolve(process.cwd(), 'screenshots');
        const expectedPath = path.resolve(screenshotsDir, testFilename);
        
        if (fs.existsSync(expectedPath)) {
            console.log(`\nSUCCESS: Screenshot file confirmed at ${expectedPath}`);
        } else {
            console.error(`\nERROR: Screenshot file NOT found at ${expectedPath}`);
        }

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
