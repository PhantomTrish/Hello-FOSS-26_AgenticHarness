import { BrowserDaemon } from './daemon.js';
import { getAnnotatedAccessibilityTree } from './accessibility.js';
import fs from 'node:fs';
import path from 'node:path';

export async function navigate(url: string): Promise<string> {
    // Network Guard: Block local internal IP metadata endpoints
    if (url.includes('169.254.169.254')) {
        throw new Error('Access to internal metadata IPs is blocked.');
    }

    const daemon = BrowserDaemon.getInstance();
    const page = await daemon.getPage();
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Wait for network to idle slightly so JS frameworks can render
    await page.waitForLoadState('networkidle').catch(() => {});
    
    return await getAnnotatedAccessibilityTree(page);
}

export async function click(role: string, name: string): Promise<string> {
    const daemon = BrowserDaemon.getInstance();
    const page = await daemon.getPage();

    // Find the element by role and name (as seen in the ARIA snapshot)
    const locator = page.getByRole(role as any, { name }).first();
    await locator.click();
    
    await page.waitForLoadState('networkidle').catch(() => {});
    return await getAnnotatedAccessibilityTree(page);
}

export async function type(role: string, name: string, text: string): Promise<string> {
    const daemon = BrowserDaemon.getInstance();
    const page = await daemon.getPage();

    const locator = page.getByRole(role as any, { name }).first();
    
    // Clear and fill
    await locator.fill(text);
    
    await page.waitForLoadState('networkidle').catch(() => {});
    return await getAnnotatedAccessibilityTree(page);
}

export async function screenshot(filename?: string): Promise<{ status: string; filename: string; fullPath: string }> {
    const daemon = BrowserDaemon.getInstance();
    const page = await daemon.getPage();
    
    const screenshotsDir = path.resolve(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const safeFilename = filename || `screenshot-${Date.now()}.png`;
    const fullPath = path.resolve(screenshotsDir, safeFilename);
    
    // Explicit file writing to disk
    await page.screenshot({ path: fullPath, fullPage: true });
    
    console.log(`[Browser Tool] Screenshot saved to: ${fullPath}`);
    
    return {
        status: 'success',
        filename: safeFilename,
        fullPath: fullPath
    };
}
