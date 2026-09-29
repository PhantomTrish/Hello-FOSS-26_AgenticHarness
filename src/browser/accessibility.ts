import { Page } from 'playwright';

export async function getAnnotatedAccessibilityTree(page: Page): Promise<string> {
    try {
        // Use modern Playwright ARIA snapshot (returns YAML representation of the accessibility tree)
        const snapshot = await page.locator('body').ariaSnapshot();
        return snapshot || 'No accessibility tree found.';
    } catch (e: any) {
        return `Failed to get accessibility snapshot: ${e.message}`;
    }
}
