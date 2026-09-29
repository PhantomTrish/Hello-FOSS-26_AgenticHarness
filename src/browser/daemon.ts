import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface BrowserOptions {
    headless?: boolean;
}

export class BrowserDaemon {
    private static instance: BrowserDaemon | null = null;
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private options: BrowserOptions;

    private constructor(options: BrowserOptions = {}) {
        // Default to headless true unless explicitly false
        this.options = { headless: options.headless ?? true };
        
        // Register cleanup handlers
        process.on('SIGINT', this.close.bind(this));
        process.on('SIGTERM', this.close.bind(this));
        process.on('exit', this.close.bind(this));
    }

    public static getInstance(options?: BrowserOptions): BrowserDaemon {
        if (!BrowserDaemon.instance) {
            BrowserDaemon.instance = new BrowserDaemon(options);
        }
        return BrowserDaemon.instance;
    }

    public async getPage(): Promise<Page> {
        if (!this.browser) {
            const isHeadless = this.options.headless;
            const launchArgs = [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ];
            
            if (!isHeadless) {
                launchArgs.push('--start-maximized');
            }
            
            this.browser = await chromium.launch({
                headless: isHeadless,
                args: launchArgs,
                slowMo: isHeadless ? undefined : 500
            });
        }
        if (!this.context) {
            const isHeadless = this.options.headless;
            const contextOptions: any = {};
            if (isHeadless) {
                contextOptions.viewport = { width: 1280, height: 720 };
                contextOptions.deviceScaleFactor = 1;
            } else {
                contextOptions.viewport = null;
            }
            
            // Setup isolated context
            this.context = await this.browser.newContext(contextOptions);
        }
        if (!this.page || this.page.isClosed()) {
            this.page = await this.context.newPage();
        }
        return this.page;
    }

    public async close(): Promise<void> {
        if (this.context) {
            await this.context.close().catch(() => {});
            this.context = null;
        }
        if (this.browser) {
            await this.browser.close().catch(() => {});
            this.browser = null;
        }
        this.page = null;
    }
}
