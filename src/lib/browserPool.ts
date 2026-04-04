import puppeteer, { Browser } from 'puppeteer';

interface BrowserPoolOptions {
  max?: number;
  min?: number;
  idleTimeoutMs?: number;
}

/**
 * Browser Pool for efficient Puppeteer browser management
 * Reuses browser instances to reduce overhead and improve performance
 */
export class BrowserPool {
  private pendingInitialization?: Promise<void>;
  private browsers: Browser[] = [];
  private available: Browser[] = [];
  private maxBrowsers: number;
  private minBrowsers: number;
  private idleTimeoutMs: number;
  private waitQueue: Array<(browser: Browser) => void> = [];
  private isInitialized = false;

  constructor(options: BrowserPoolOptions = {}) {
    this.maxBrowsers = options.max ?? 5;
    this.minBrowsers = options.min ?? 1;
    this.idleTimeoutMs = options.idleTimeoutMs ?? 30000;
  }

  async initialize(): Promise<void> {
    if (!this.isInitialized && !this.pendingInitialization) {
      this.pendingInitialization = new Promise(async (resolve) => {
        console.log(`Initializing browser pool with ${this.minBrowsers} browsers...`);
  
        const browsers = await Promise.allSettled(
          Array.from(
            { length: this.minBrowsers },
            () => this.createBrowser()
          )
        );
    
        browsers.forEach((browser) => {    
          if (browser.status === 'rejected') {
            return console.error('Failed to initialize browser:', browser.reason);
          }
    
          this.browsers.push(browser.value);
          this.available.push(browser.value);
        })
    
        this.isInitialized = true;
        console.log(`Browser pool initialized with ${this.browsers.length} browsers`);
  
        resolve();
      });
    };

    return this.pendingInitialization;
  }

  async destroy(): Promise<void> {
    console.log('Destroying browser pool...');

    this.waitQueue = [];

    await Promise.all(
      this.browsers.map(browser =>
        browser.close().catch(err => console.error('Error closing browser:', err))
      )
    );

    this.browsers = [];
    this.available = [];
    this.isInitialized = false;

    console.log('Browser pool destroyed');
  }

  async acquire(): Promise<Browser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.available.length > 0) {
      const browser = this.available.pop()!;

      if (browser.connected) {
        return browser;
      }

      this.removeBrowser(browser);
      return this.acquire();
    }

    if (this.browsers.length < this.maxBrowsers) {
      const browser = await this.createBrowser();
      this.browsers.push(browser);
      return browser;
    }

    return this.waitForBrowser();
  }

  async release(browser: Browser): Promise<void> {
    const pages = await browser.pages();

    if (pages.length > 1) {
      await Promise.allSettled(pages.slice(1).map(page => page.close()));
    }

    // If there are waiting requests, give them the browser immediately
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve(browser);
      return;
    }

    // Add back to available pool
    if (browser.connected) {
      this.available.push(browser);
    } else {
      this.removeBrowser(browser);
    }
  }

  getStats() {
    return {
      total: this.browsers.length,
      available: this.available.length,
      inUse: this.browsers.length - this.available.length,
      waiting: this.waitQueue.length,
      maxBrowsers: this.maxBrowsers,
    };
  }

  private async createBrowser(): Promise<Browser> {
    const browser = await puppeteer.launch({
      headless: true,
      timeout: 60000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-crash-reporter',
        '--disable-breakpad',
        '--disable-features=TranslateUI',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-extensions',
      ],
    });

    browser.on('disconnected', () => {
      console.warn('Browser disconnected, removing from pool');
      this.removeBrowser(browser);
    });

    return browser;
  }

  private waitForBrowser(): Promise<Browser> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.indexOf(resolve);

        if (index > -1) {
          this.waitQueue.splice(index, 1);
        }

        reject(new Error('Browser acquisition timeout'));
      }, this.idleTimeoutMs);

      const wrappedResolve = (browser: Browser) => {
        clearTimeout(timeout);
        resolve(browser);
      };

      this.waitQueue.push(wrappedResolve);
    });
  }

  private removeBrowser(browser: Browser): void {
    const index = this.browsers.indexOf(browser);
    const availableIndex = this.available.indexOf(browser);

    if (index > -1) {
      this.browsers.splice(index, 1);
    }

    if (availableIndex > -1) {
      this.available.splice(availableIndex, 1);
    }

    browser.close().catch(() => { });
  }
}

// Singleton instance
export const browserPool = new BrowserPool({
  max: Number(process.env.BROWSER_POOL_MAX || 5),
  min: Number(process.env.BROWSER_POOL_MIN || 1),
  idleTimeoutMs: Number(process.env.BROWSER_POOL_IDLE_TIMEOUT_MS || 60000),
});

// Initialize pool on module load
browserPool.initialize().catch(err => {
  console.error('Failed to initialize browser pool:', err);
});

// Cleanup on process exit (only in Node.js runtime, not Edge Runtime)
process?.on?.('SIGTERM', async () => {
  await browserPool.destroy();
  process.exit(0);
});

process?.on?.('SIGINT', async () => {
  await browserPool.destroy();
  process.exit(0);
});
