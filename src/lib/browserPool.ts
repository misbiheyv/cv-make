import puppeteer, { Browser } from 'puppeteer';

import { createLogger } from '@/lib/logger';
import {
  browserPoolSize,
  browserPoolQueueDepth,
  browserPoolOperationsTotal,
  browserPoolAcquireDuration,
} from '@/lib/metrics';

const log = createLogger('browserPool');

interface BrowserPoolOptions {
  max?: number;
  min?: number;
  idleTimeoutMs?: number;
  acquireTimeoutMs?: number;
  maxQueueSize?: number;
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
  private acquireTimeoutMs: number;
  private maxQueueSize: number;
  private pendingCreations = 0;
  private waitQueue: Array<(browser: Browser) => void> = [];
  private isInitialized = false;
  private idleTimers = new Map<Browser, ReturnType<typeof setTimeout>>();

  constructor(options: BrowserPoolOptions = {}) {
    this.maxBrowsers = options.max ?? 5;
    this.minBrowsers = options.min ?? 1;
    this.idleTimeoutMs = options.idleTimeoutMs ?? 30000;
    this.acquireTimeoutMs = options.acquireTimeoutMs ?? 60000;
    this.maxQueueSize = options.maxQueueSize ?? 50;
  }

  async initialize(): Promise<void> {
    if (!this.isInitialized && !this.pendingInitialization) {
      this.pendingInitialization = new Promise(async (resolve) => {
        log.info({ minBrowsers: this.minBrowsers }, 'Initializing browser pool');
  
        const browsers = await Promise.allSettled(
          Array.from(
            { length: this.minBrowsers },
            () => this.createBrowser()
          )
        );
    
        browsers.forEach((browser) => {    
          if (browser.status === 'rejected') {
            log.error({ error: browser.reason }, 'Failed to initialize browser'); return;
          }
    
          this.browsers.push(browser.value);
          this.available.push(browser.value);
        })
    
        this.isInitialized = true;
        this.updatePoolGauges();
        log.info({ totalBrowsers: this.browsers.length }, 'Browser pool initialized');
  
        resolve();
      });
    };

    return this.pendingInitialization;
  }

  async destroy(): Promise<void> {
    log.info('Destroying browser pool');

    this.waitQueue = [];

    for (const timer of this.idleTimers.values()) {
      clearTimeout(timer);
    }
    this.idleTimers.clear();

    await Promise.all(
      this.browsers.map(browser =>
        browser.close().catch(err => log.error({ error: err }, 'Error closing browser'))
      )
    );

    this.browsers = [];
    this.available = [];
    this.isInitialized = false;

    log.info('Browser pool destroyed');
  }

  async acquire(): Promise<Browser> {
    const endTimer = browserPoolAcquireDuration.startTimer();

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.available.length > 0) {
      const browser = this.available.pop()!;
      this.clearIdleTimer(browser);

      if (browser.connected) {
        browserPoolOperationsTotal.inc({ operation: 'acquire' });
        this.updatePoolGauges();
        endTimer();
        return browser;
      }

      this.removeBrowser(browser);
      endTimer();
      return this.acquire();
    }

    if (this.browsers.length + this.pendingCreations < this.maxBrowsers) {
      this.pendingCreations++;
      try {
        const browser = await this.createBrowser();
        this.browsers.push(browser);
        browserPoolOperationsTotal.inc({ operation: 'acquire' });
        this.updatePoolGauges();
        endTimer();
        return browser;
      } catch (err) {
        endTimer();
        throw err;
      } finally {
        this.pendingCreations--;
      }
    }

    const browser = await this.waitForBrowser();
    browserPoolOperationsTotal.inc({ operation: 'acquire' });
    this.updatePoolGauges();
    endTimer();
    return browser;
  }

  async release(browser: Browser): Promise<void> {
    const pages = await browser.pages();

    if (pages.length > 1) {
      await Promise.allSettled(pages.slice(1).map(page => page.close()));
    }

    browserPoolOperationsTotal.inc({ operation: 'release' });

    // If there are waiting requests, give them the browser immediately
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve(browser);
      this.updatePoolGauges();
      return;
    }

    // Add back to available pool
    if (browser.connected) {
      this.available.push(browser);
      this.startIdleTimer(browser);
    } else {
      this.removeBrowser(browser);
    }

    this.updatePoolGauges();
  }

  getStats() {
    return {
      total: this.browsers.length,
      available: this.available.length,
      inUse: this.browsers.length - this.available.length,
      waiting: this.waitQueue.length,
      pendingCreations: this.pendingCreations,
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
      log.warn('Browser disconnected, removing from pool');
      this.removeBrowser(browser);
    });

    browserPoolOperationsTotal.inc({ operation: 'create' });

    return browser;
  }

  private waitForBrowser(): Promise<Browser> {
    if (this.waitQueue.length >= this.maxQueueSize) {
      return Promise.reject(new Error('Server is busy, please try again later'));
    }

    return new Promise((resolve, reject) => {
      let wrappedResolve: (browser: Browser) => void;

      const timeout = setTimeout(() => {
        const index = this.waitQueue.indexOf(wrappedResolve);

        if (index > -1) {
          this.waitQueue.splice(index, 1);
        }

        browserPoolQueueDepth.set(this.waitQueue.length);

        reject(new Error('Browser acquisition timeout'));
      }, this.acquireTimeoutMs);

      wrappedResolve = (browser: Browser) => {
        clearTimeout(timeout);
        resolve(browser);
      };

      this.waitQueue.push(wrappedResolve);
      browserPoolQueueDepth.set(this.waitQueue.length);
    });
  }

  private startIdleTimer(browser: Browser): void {
    this.clearIdleTimer(browser);

    if (this.browsers.length <= this.minBrowsers) {
      return;
    }

    const timer = setTimeout(() => {
      this.idleTimers.delete(browser);

      if (this.browsers.length > this.minBrowsers && this.available.includes(browser)) {
        log.info({ poolSize: this.browsers.length, newPoolSize: this.browsers.length - 1 }, 'Closing idle browser');
        this.removeBrowser(browser);
      }
    }, this.idleTimeoutMs);

    timer.unref?.();
    this.idleTimers.set(browser, timer);
  }

  private clearIdleTimer(browser: Browser): void {
    const timer = this.idleTimers.get(browser);

    if (timer) {
      clearTimeout(timer);
      this.idleTimers.delete(browser);
    }
  }

  private updatePoolGauges(): void {
    browserPoolSize.set({ state: 'available' }, this.available.length);
    browserPoolSize.set({ state: 'in_use' }, this.browsers.length - this.available.length);
    browserPoolQueueDepth.set(this.waitQueue.length);
  }

  private removeBrowser(browser: Browser): void {
    this.clearIdleTimer(browser);

    const index = this.browsers.indexOf(browser);
    const availableIndex = this.available.indexOf(browser);

    if (index > -1) {
      this.browsers.splice(index, 1);
    }

    if (availableIndex > -1) {
      this.available.splice(availableIndex, 1);
    }

    browser.close().catch(() => { });

    browserPoolOperationsTotal.inc({ operation: 'destroy' });
    this.updatePoolGauges();
  }
}

// Singleton instance
export const browserPool = new BrowserPool({
  max: Number(process.env.BROWSER_POOL_MAX || 5),
  min: Number(process.env.BROWSER_POOL_MIN || 1),
  idleTimeoutMs: Number(process.env.BROWSER_POOL_IDLE_TIMEOUT_MS || 60000),
  maxQueueSize: Number(process.env.BROWSER_POOL_MAX_QUEUE || 100),
});

// Initialize pool on module load
browserPool.initialize().catch(err => {
  log.error({ error: err }, 'Failed to initialize browser pool');
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
