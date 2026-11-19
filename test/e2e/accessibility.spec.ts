import type { Locator, Page } from '@playwright/test';
import { test, expect, openPage } from './helpers.ts';

/*
 * Accessibility tests for the components example site (`examples/components`),
 * built and served by `playwright.config.ts`: what keyboard and screen reader
 * users can do. Every test uses the keyboard only, and runs in the `light` and
 * the `dark` project.
 */

const ROUTE_MAP = 'A route with four stops, from A to D';

test.describe('keyboard and screen readers', () => {
  test('each diagram has a name for screen readers', async ({ page }) => {
    const content = await openPage(page, '/media/diagrams');

    await expect(content.getByRole('img', { name: 'Diagram' })).toBeVisible();
  });

  test("a diagram's preview opens, works and closes with the keyboard", async ({ page }) => {
    const content = await openPage(page, '/media/diagrams');
    const diagram = content.getByRole('button', { name: 'Diagram' });
    const preview = page.getByRole('dialog', { name: 'Diagram preview' });

    await diagram.focus();
    await page.keyboard.press('Enter');
    await expect(preview).toContainText('100%');
    await expectKeyboardStaysIn(page, preview);
    await page.keyboard.press('+');
    await expect(preview).not.toContainText('100%');
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
    await expect(diagram).toBeFocused();

    // The close button, which gets the keyboard first, closes it too.
    await page.keyboard.press('Enter');
    await expect(preview.getByRole('button', { name: 'Close diagram preview' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(preview).toBeHidden();
    await expect(diagram).toBeFocused();
  });

  test("an image's preview opens and closes with the keyboard", async ({ page }) => {
    const content = await openPage(page, '/media/advanced-images');
    const image = content.getByRole('button', { name: ROUTE_MAP });
    const preview = page.getByRole('dialog', { name: ROUTE_MAP });

    await image.focus();
    await page.keyboard.press('Enter');
    await expect(preview).toBeVisible();
    await expectKeyboardStaysIn(page, preview);
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
    await expect(image).toBeFocused();

    // The close button, which gets the keyboard first, closes it too.
    await page.keyboard.press('Enter');
    await expect(preview.getByRole('button', { name: 'Close image preview' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(preview).toBeHidden();
    await expect(image).toBeFocused();
  });

  test('search tells screen readers which result is selected', async ({ page }) => {
    await openPage(page, '/');
    const search = page.getByRole('dialog', { name: 'Search' });
    const field = search.getByRole('combobox', { name: 'Search' });

    await page.keyboard.press('ControlOrMeta+k');
    await expect(field).toBeFocused();
    await page.keyboard.type('card');
    const results = search.getByRole('option');
    await expect(results.nth(1)).toBeVisible();

    await page.keyboard.press('ArrowDown');
    const selected = search.getByRole('option', { selected: true });
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveId((await results.nth(1).getAttribute('id')) ?? '');
    await expect(field).toHaveAttribute(
      'aria-activedescendant',
      (await selected.getAttribute('id')) ?? '',
    );

    await expectKeyboardStaysIn(page, search);
    await page.keyboard.press('Escape');
    await expect(search).toBeHidden();
  });
});

/**
 * Presses Tab a few times and checks that the keyboard never reaches the page
 * behind `dialog`. The browser may move it to its own address bar after the
 * last button, which leaves the page's focus on <body>.
 */
async function expectKeyboardStaysIn(page: Page, dialog: Locator): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    await expect
      .poll(() =>
        dialog.evaluate(
          (d) => document.activeElement === document.body || d.contains(document.activeElement),
        ),
      )
      .toBe(true);
  }
}
