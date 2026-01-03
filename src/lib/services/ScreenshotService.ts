/**
 * Screenshot Service
 *
 * Captures screenshots of competitor websites for blueprint inspiration
 * Uses Puppeteer to render and screenshot web pages
 *
 * Screenshots stored in /tmp and uploaded to cloud storage (future)
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { query } from '@/lib/db';

interface ScreenshotOptions {
  fullPage?: boolean;        // Capture full scrollable page (default: true)
  width?: number;            // Viewport width (default: 1920)
  height?: number;           // Viewport height (default: 1080)
  timeout?: number;          // Page load timeout in ms (default: 30000)
  waitForSelector?: string;  // Wait for specific element before screenshot
  removeElements?: string[]; // CSS selectors to hide before screenshot (e.g., chat widgets)
}

interface ScreenshotResult {
  success: boolean;
  screenshotPath?: string;
  screenshotUrl?: string;    // Future: Cloud storage URL
  width?: number;
  height?: number;
  fileSize?: number;         // Bytes
  capturedAt?: string;
  error?: string;
}

export class ScreenshotService {
  private browser: Browser | null = null;
  private screenshotsDir: string;

  constructor() {
    this.screenshotsDir = '/tmp/quad-screenshots';
  }

  /**
   * Initialize Puppeteer browser
   */
  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
  }

  /**
   * Capture screenshot of URL
   */
  async captureScreenshot(
    url: string,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const {
      fullPage = true,
      width = 1920,
      height = 1080,
      timeout = 30000,
      waitForSelector,
      removeElements = [],
    } = options;

    let page: Page | null = null;

    try {
      // Ensure screenshots directory exists
      await fs.mkdir(this.screenshotsDir, { recursive: true });

      // Initialize browser
      await this.initBrowser();

      if (!this.browser) {
        throw new Error('Failed to initialize browser');
      }

      // Create new page
      page = await this.browser.newPage();

      // Set viewport
      await page.setViewport({ width, height });

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout,
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }

      // Remove unwanted elements (chat widgets, popups, etc.)
      if (removeElements.length > 0) {
        await page.evaluate((selectors) => {
          selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });
        }, removeElements);
      }

      // Generate filename
      const filename = this.generateFilename(url);
      const screenshotPath = path.join(this.screenshotsDir, filename);

      // Take screenshot
      await page.screenshot({
        path: screenshotPath,
        fullPage,
      });

      // Get file stats
      const stats = await fs.stat(screenshotPath);

      // Get actual dimensions
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }));

      // Close page
      await page.close();

      return {
        success: true,
        screenshotPath,
        width: dimensions.width,
        height: dimensions.height,
        fileSize: stats.size,
        capturedAt: new Date().toISOString(),
      };

    } catch (error: any) {
      if (page) {
        await page.close();
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Capture screenshots of multiple URLs (e.g., main page + dashboard + login)
   */
  async captureMultiple(
    urls: Array<{ name: string; url: string }>,
    options: ScreenshotOptions = {}
  ): Promise<Array<{ name: string; result: ScreenshotResult }>> {
    const results: Array<{ name: string; result: ScreenshotResult }> = [];

    for (const { name, url } of urls) {
      const result = await this.captureScreenshot(url, options);
      results.push({ name, result });

      // Small delay between screenshots
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Capture screenshot and save to database
   */
  async captureAndSave(
    resourceId: string,
    url: string,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const result = await this.captureScreenshot(url, options);

    if (result.success && result.screenshotPath) {
      // Store screenshot metadata in database
      const now = new Date().toISOString();

      await query(
        `INSERT INTO QUAD_resource_attributes (resource_id, attribute_name, attribute_value, created_at, updated_at)
         VALUES ($1, 'blueprint_screenshot_url', $2, $3, $3)
         ON CONFLICT (resource_id, attribute_name)
         DO UPDATE SET attribute_value = $2, updated_at = $3`,
        [resourceId, result.screenshotPath, now]
      );

      // TODO: Upload to cloud storage (S3/GCS) and update with public URL
      // For now, screenshot is stored locally at /tmp/quad-screenshots/
    }

    return result;
  }

  /**
   * Generate filename from URL
   */
  private generateFilename(url: string): string {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/\./g, '-');
    const timestamp = Date.now();
    return `screenshot-${hostname}-${timestamp}.png`;
  }

  /**
   * Cleanup: Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Cleanup old screenshots (older than 7 days)
   */
  async cleanupOldScreenshots(maxAgeDays: number = 7): Promise<number> {
    try {
      const files = await fs.readdir(this.screenshotsDir);
      const now = Date.now();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.screenshotsDir, file);
        const stats = await fs.stat(filePath);
        const ageMs = now - stats.mtimeMs;

        if (ageMs > maxAgeMs) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;

    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }
}

export default ScreenshotService;
