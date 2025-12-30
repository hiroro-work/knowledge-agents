import type { Page, Locator } from '@playwright/test';

const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

const waitFor = async (predicate: () => Promise<boolean>, { interval = 1000, retry = 3 } = {}) => {
  let count = 0;
  while (count < retry) {
    if (await predicate()) {
      return true;
    }
    await sleep(interval);
    count++;
  }
  return false;
};

const scrollBottomInfinite = async (container: Locator, page: Page, getItemCount: () => Promise<number>) => {
  const scrollArea = container.locator('[class*="mantine-ScrollArea-viewport"]');
  const loader = scrollArea.locator('[class*="mantine-Loader"]');
  let previousCount = -1;
  let currentCount = await getItemCount();

  while (previousCount !== currentCount) {
    previousCount = currentCount;
    if ((await loader.count()) > 0) {
      await loader.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
    } else {
      await scrollArea.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    }
    currentCount = await getItemCount();
  }
};

export { waitFor, scrollBottomInfinite };
