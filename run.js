"use strict";

const { chromium } = require("playwright-core");

const NAVIGATION_TIMEOUT = 30_000;
const MIN_DELAY_MS = 5_000;
const MAX_DELAY_MS = 30_000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseDomain(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    throw new Error("DOMAIN_NAME is not configured.");
  }

  const input = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(input);

  if (["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }

  if (!url.hostname || url.username || url.password) {
    throw new Error("Invalid DOMAIN_NAME.");
  }

  return url;
}

(async () => {
  let browser;

  try {
    const target = parseDomain(process.env.DOMAIN_NAME);

    await sleep(randomInt(MIN_DELAY_MS, MAX_DELAY_MS));

    browser = await chromium.launch({
      channel: "chrome",
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--no-first-run"
      ]
    });

    const page = await browser.newPage({
      serviceWorkers: "block"
    });

    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

    const response = await page.goto(target.href, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT
    });

    const status = response?.status() ?? 0;
    console.log(`Request completed with status ${status || "n/a"}`);

    if (status >= 400) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Run failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
})();
