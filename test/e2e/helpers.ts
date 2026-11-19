import { test as base, expect, type Locator, type Page } from '@playwright/test';

/*
 * Shared by the browser tests of every example site: the `test` to use, the
 * theme of the project, and how to find and check Mordoc's components the
 * way a reader sees them.
 */

export { expect };

export type Theme = 'light' | 'dark';

export const test = base.extend<{ failOnPageErrors: undefined }>({
  // A component that throws in the browser is broken, even when its HTML,
  // which was rendered at build time, still looks right.
  failOnPageErrors: [
    async ({ page }, use) => {
      const errors: Error[] = [];
      page.on('pageerror', (error) => errors.push(error));
      await use(undefined);
      expect(errors, 'JavaScript errors on the page').toEqual([]);
    },
    { auto: true },
  ],
});

/** The theme the project stores before each page loads. */
export function projectTheme(): Theme {
  return test.info().project.name === 'dark' ? 'dark' : 'light';
}

/** Checks the theme of the page: Mordoc marks the dark theme with the `dark` class on `<html>`. */
export async function expectTheme(page: Page, theme: Theme): Promise<void> {
  const html = page.locator('html');
  if (theme === 'dark') await expect(html).toHaveClass(/\bdark\b/);
  else await expect(html).not.toHaveClass(/\bdark\b/);
}

/** Opens a page, checks that it has the theme of the project, and returns its content. */
export async function openPage(page: Page, path: string): Promise<Locator> {
  await page.goto(path);
  await expectTheme(page, projectTheme());
  return page.locator('article').first();
}

/** An accordion, found by its title. */
export function accordion(scope: Locator, title: string): Locator {
  return scope.getByRole('group').filter({ hasText: title });
}

/** A code block with its language and copy button, found by part of its code. */
export function codeBlock(scope: Locator, code: string): Locator {
  // The innermost element around both the code and its copy button.
  return scope
    .locator('div')
    .filter({ has: scope.page().locator('code', { hasText: code }) })
    .last();
}

/** Checks that each text is shown as a whole element, such as a title or a paragraph. */
export async function expectTexts(scope: Locator, texts: string[]): Promise<void> {
  for (const text of texts) {
    await expect(scope.getByText(text, { exact: true }).first()).toBeVisible();
  }
}

/** Checks that a link is shown and where it leads. */
export async function expectLink(
  scope: Locator,
  name: string | RegExp,
  href: string,
): Promise<Locator> {
  const link = scope.getByRole('link', { name, exact: typeof name === 'string' });
  await expect(link).toHaveAttribute('href', href);
  return link;
}

/** Checks that an image is visible and its file has loaded. */
export async function expectImageShown(image: Locator): Promise<void> {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
}

/** Checks the text on the clipboard; the projects grant the clipboard permissions. */
export async function expectClipboard(page: Page, text: string | RegExp): Promise<void> {
  const read = () => page.evaluate(() => navigator.clipboard.readText());
  if (typeof text === 'string') await expect.poll(read).toBe(text);
  else await expect.poll(read).toMatch(text);
}
