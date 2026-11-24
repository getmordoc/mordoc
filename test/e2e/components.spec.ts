import type { Locator } from '@playwright/test';
import {
  test,
  expect,
  openPage,
  projectTheme,
  expectTheme,
  accordion,
  codeBlock,
  expectTexts,
  expectLink,
  expectImageShown,
  expectClipboard,
  type Theme,
} from './helpers.ts';

/*
 * Browser tests for the components example site (`examples/components`),
 * built and served by `playwright.config.ts`. Every test runs in the `light`
 * and the `dark` project, which store the reader's theme before the page
 * loads.
 */

const ROUTE_MAP = 'A route with four stops, from A to D';
const VOLCANO = 'A volcano at the end of the route';
const ROUTE_MAP_FROM_VARIABLE = 'A route with four stops, from a variable';
const CLIP = 'Smoke rising from a glowing volcano';

/** Checks that one sidebar link is the current page, and that only that link looks like it. */
async function expectOnlyMarked(links: Locator, name: string): Promise<void> {
  const marked = () =>
    links.evaluateAll((all) => {
      const current = all.filter((link) => link.getAttribute('aria-current') === 'page');
      const activeColor = current[0] && getComputedStyle(current[0]).color;
      const active = all.filter((link) => getComputedStyle(link).color === activeColor);
      const names = (found: Element[]) => found.map((link) => link.textContent);
      return { current: names(current), active: names(active) };
    });
  await expect.poll(marked).toEqual({ current: [name], active: [name] });
}

test.describe('pages', () => {
  test('home page shows the heroes, sections, card grid, buttons and diagram', async ({ page }) => {
    const content = await openPage(page, '/');

    await expect(
      content.getByRole('heading', { level: 1, name: 'Every component, one journey.' }),
    ).toBeVisible();
    await expect(
      content.getByRole('heading', { level: 1, name: 'A hero with an image' }),
    ).toBeVisible();
    await expect(
      content.getByRole('heading', { level: 2, name: 'What is on this site' }),
    ).toBeVisible();
    await expect(
      content.getByRole('heading', { level: 2, name: 'A section with a background image' }),
    ).toBeVisible();
    await expectTexts(content, ['A section can also have no title.']);
    await expectLink(content, 'Read the guide', '/guide');
    await expectLink(content, 'See the media', '/media');
    await expectLink(content, 'See cards', '/guide/cards');
    await expectLink(content, /^Callouts/, '/guide/callouts');
    await expectLink(content, /^New Cards/, '/guide/cards');
    await expectLink(content, /^Media/, '/media');
    await expect(content.getByRole('figure').getByRole('img')).toContainText('Plan a journey');
  });

  test('callouts page shows each callout type with and without a title', async ({ page }) => {
    const content = await openPage(page, '/guide/callouts');

    await expectTexts(content, [
      'Note',
      'Tip',
      'Warning',
      'Danger',
      'Before you leave',
      'The guide saves your route every evening.',
      'Never climb the volcano without a guide.',
      'A callout without a type is a note.',
      'A danger without a title.',
      'Pack food for the road.',
    ]);
    await expect(codeBlock(content, 'journey plan stop-a stop-d')).toBeVisible();
    await expect(content.getByRole('blockquote')).toContainText(
      'Every journey starts at your own front door.',
    );
  });

  test('cards page shows plain, icon, image, linked and tagged cards', async ({ page }) => {
    const content = await openPage(page, '/guide/cards');

    await expectTexts(content, [
      'Plain card',
      'Icon card',
      'Image card',
      'Stop A',
      'Stop B',
      'Stop C',
      'Stop D',
    ]);
    await expectLink(content, /^Linked card/, '/guide/buttons');
    const taggedCard = await expectLink(content, /Card with a tag/, '/guide/columns');
    await expect(taggedCard).toContainText('Beta');
  });

  test('buttons page shows primary, secondary and external buttons', async ({ page }) => {
    const content = await openPage(page, '/guide/buttons');

    await expectLink(content, 'Primary button', '/guide');
    await expectLink(content, 'Secondary button', '/guide');
    await expectLink(content, 'Button to another site', 'https://www.mordoc.dev');
  });

  test('accordions page shows single and grouped accordions', async ({ page }) => {
    const content = await openPage(page, '/guide/accordions');

    await expect(accordion(content, 'What is this site?')).not.toHaveAttribute('open');
    const openOnLoad = accordion(content, 'Open when the page loads');
    await expect(openOnLoad).toHaveAttribute('open');
    await expectTexts(openOnLoad, ['This accordion starts open.']);
    for (const title of ['First stop', 'Second stop', 'Third stop']) {
      await expect(accordion(content, title)).toBeVisible();
    }
  });

  test('columns page shows columns with and without a divider', async ({ page }) => {
    const content = await openPage(page, '/guide/columns');

    for (const title of ['Before', 'After', 'Left', 'Middle', 'Right']) {
      await expect(content.getByRole('heading', { level: 3, name: title })).toBeVisible();
    }
    await expectTexts(content, ['The guide shows the whole route.', 'Volcanoes']);
  });

  test('headings and tables page shows every heading level and a table', async ({ page }) => {
    const content = await openPage(page, '/guide/text');

    for (const [level, name] of [
      [2, 'second'],
      [3, 'third'],
      [4, 'fourth'],
      [5, 'fifth'],
      [6, 'sixth'],
    ] as const) {
      await expect(
        content.getByRole('heading', { level, name: `A ${name}-level heading` }),
      ).toBeVisible();
    }
    await expect(content.locator('h2#custom-id')).toContainText('A heading with its own ID');
    await expectLink(content, 'this link', '#custom-id');
    const table = content.getByRole('table');
    await expect(table.getByRole('columnheader')).toHaveText([
      'Stop',
      'Days on foot',
      'Distance from stop A',
    ]);
    await expect(table.getByRole('row', { name: 'Stop D 120 2,200 km' })).toBeVisible();
  });

  test('links page shows Markdown links, link tags and variables', async ({ page }) => {
    const content = await openPage(page, '/guide/links');

    await expectLink(content, 'Callouts', '/guide/callouts');
    await expectLink(content, 'Mordoc on GitHub', 'https://github.com/getmordoc/mordoc');
    await expectLink(content, 'Variables', '#variables');
    await expectLink(content, 'Buttons, with a title', '/guide/buttons');
    await expectTexts(content, [
      "Variables come from the site's settings. This product is called Components, and its support address is help@components.example.",
    ]);
  });

  test('code page shows highlighted code blocks with variables filled in', async ({ page }) => {
    const content = await openPage(page, '/guide/code');

    await expectTexts(content, ['Js', 'Ts', 'Bash', 'Json', 'Yaml', 'Markdown']);
    // Highlighting wraps the parts of the code in their own elements.
    await expect(codeBlock(content, 'const stops').locator('.token').first()).toBeVisible();
    for (const code of [
      'Plain text, with no highlighting.',
      "baseUrl: 'https://api.components.example'",
      'npm install @components/journey@2.4.0',
      '{% $exampleSdkVersion %}',
    ]) {
      await expect(codeBlock(content, code)).toBeVisible();
    }
  });

  test('images page shows Markdown images and image tags', async ({ page }) => {
    const content = await openPage(page, '/media/images');

    for (const name of [ROUTE_MAP, VOLCANO, ROUTE_MAP_FROM_VARIABLE, 'eye icon']) {
      await expectImageShown(content.getByRole('img', { name }));
    }
    const imageLink = await expectLink(content, 'Guide', '/guide');
    await expectImageShown(imageLink.getByRole('img', { name: 'Guide' }));
  });

  test('advanced images page shows images with and without a caption', async ({ page }) => {
    const content = await openPage(page, '/media/advanced-images');

    const withCaption = content.getByRole('figure', {
      name: 'The journey in four stops',
      exact: true,
    });
    await expectImageShown(withCaption.getByRole('img', { name: ROUTE_MAP }));
    await expectImageShown(content.getByRole('img', { name: VOLCANO }));
    const fromVariable = content.getByRole('figure', {
      name: 'The journey in four stops, from a variable',
    });
    await expectImageShown(fromVariable.getByRole('img', { name: ROUTE_MAP_FROM_VARIABLE }));
  });

  test('video page shows clips and video embeds', async ({ page }) => {
    const content = await openPage(page, '/media/video');

    await expect(
      content
        .getByRole('figure', { name: 'The volcano' })
        .getByRole('button', { name: `Play: ${CLIP}` }),
    ).toBeVisible();
    await expect(content.getByRole('button', { name: `Play: ${CLIP}` })).toHaveCount(2);
    for (const name of [
      'Big Buck Bunny (Blender Foundation, CC BY 3.0)',
      'The same video in 4:3',
    ]) {
      const iframe = content.getByRole('figure', { name }).locator('iframe');
      await iframe.scrollIntoViewIfNeeded();
      await expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/aqz-KE-bpKQ');
      // The embedded player loads from YouTube itself; the video is not played.
      await expect(iframe.contentFrame().locator('body')).not.toBeEmpty();
    }
    await expectLink(
      content,
      'Open: A video from an unknown service',
      'https://video.example.com/watch/volcano',
    );
  });

  test('diagrams page shows a sequence diagram', async ({ page }) => {
    const content = await openPage(page, '/media/diagrams');

    const diagram = content.getByRole('figure').getByRole('img');
    for (const text of [
      'Traveller',
      'Travel guide',
      'Watchtower',
      'Map',
      'Plan a journey',
      'The pass is open',
    ]) {
      await expect(diagram).toContainText(text);
    }
    await expect(diagram).not.toContainText('Comments start with a hash');
  });
});

test.describe('interactions', () => {
  test('an accordion opens and closes', async ({ page }) => {
    const content = await openPage(page, '/guide/accordions');
    const single = accordion(content, 'What is this site?');

    await single.getByText('What is this site?').click();
    await expect(single).toHaveAttribute('open');
    await single.getByText('What is this site?').click();
    await expect(single).not.toHaveAttribute('open');
  });

  test('opening an accordion in a group closes the others', async ({ page }) => {
    const content = await openPage(page, '/guide/accordions');
    const first = accordion(content, 'First stop');
    const second = accordion(content, 'Second stop');

    await first.getByText('First stop').click();
    await expect(first).toHaveAttribute('open');
    await second.getByText('Second stop').click();
    await expect(second).toHaveAttribute('open');
    await expect(first).not.toHaveAttribute('open');
  });

  test('an advanced image opens larger and closes', async ({ page }) => {
    const content = await openPage(page, '/media/advanced-images');
    const image = content.getByRole('button', { name: ROUTE_MAP });
    const preview = page.getByRole('dialog', { name: ROUTE_MAP });

    await image.click();
    await expectImageShown(preview.getByRole('img', { name: ROUTE_MAP }));
    await page.getByRole('button', { name: 'Close image preview' }).click();
    await expect(preview).toBeHidden();

    // Escape closes it too.
    await image.click();
    await expect(preview).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
  });

  test('a diagram opens larger, zooms and closes', async ({ page }) => {
    const content = await openPage(page, '/media/diagrams');
    const preview = page.getByRole('dialog', { name: 'Diagram preview' });

    await content.getByRole('figure').click();
    await expect(preview).toContainText('Plan a journey');
    await expect(preview).toContainText('100%');
    await preview.getByRole('button', { name: 'Zoom in' }).click();
    await expect(preview).not.toContainText('100%');
    await preview.getByRole('button', { name: 'Zoom out' }).click();
    await expect(preview).toContainText('100%');
    await preview.getByRole('button', { name: 'Close diagram preview' }).click();
    await expect(preview).toBeHidden();
  });

  test('a clip plays and pauses', async ({ page }) => {
    const content = await openPage(page, '/media/video');
    const clip = content.getByRole('figure', { name: 'The volcano' });
    const video = clip.locator('video');

    await clip.getByRole('button', { name: `Play: ${CLIP}` }).click();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0))
      .toBe(true);
    await clip.getByRole('button', { name: `Pause: ${CLIP}` }).click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test('a code block copies its code', async ({ page }) => {
    const content = await openPage(page, '/guide/code');

    await codeBlock(content, 'npm install @components/journey')
      .getByRole('button', { name: 'Copy code' })
      .click();
    await expectClipboard(page, 'npm install @components/journey@2.4.0');
  });

  test('a heading copies its link', async ({ page }) => {
    const content = await openPage(page, '/guide/text');

    await content
      .getByRole('heading', { name: 'A table' })
      .getByRole('link', { name: 'Copy link to this section' })
      .click();
    await expect(page).toHaveURL(/\/guide\/text#a-table$/);
    await expectClipboard(page, /\/guide\/text#a-table$/);
  });

  test('the table of contents jumps to a heading', async ({ page }) => {
    await openPage(page, '/guide/text');

    await page
      .getByRole('navigation', { name: 'On this page' })
      .getByRole('link', { name: 'A table' })
      .click();
    await expect(page).toHaveURL(/#a-table$/);
    await expect(page.getByRole('heading', { name: 'A table' })).toBeInViewport();
  });

  // Some hosts open a page at its address with a slash at the end.
  for (const address of ['/guide/callouts', '/guide/callouts/']) {
    test(`the sidebar marks only the current page after opening ${address}`, async ({ page }) => {
      const messages: string[] = [];
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) messages.push(message.text());
      });
      const links = page.getByRole('navigation', { name: 'Side navigation' }).getByRole('link');

      await openPage(page, address);
      await expectOnlyMarked(links, 'Callouts');
      await links.getByText('Cards', { exact: true }).click();
      await expect(page).toHaveURL('/guide/cards');
      await expectOnlyMarked(links, 'Cards');
      expect(messages, 'messages in the browser console').toEqual([]);
    });
  }

  test('the mobile menu closes when the window becomes wide', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await openPage(page, '/guide/code');
    const body = page.locator('body');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();
    await expect(body).toHaveCSS('position', 'fixed');

    // Past the breakpoint the menu button is hidden, so include hidden elements.
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(
      page.getByRole('button', { name: 'Open menu', includeHidden: true }),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(body).not.toHaveCSS('position', 'fixed');
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('the theme switches between light and dark', async ({ page }) => {
    await openPage(page, '/');
    const start = projectTheme();
    const other: Theme = start === 'dark' ? 'light' : 'dark';

    await page.getByRole('button', { name: `Switch to ${other} mode` }).click();
    await expectTheme(page, other);
    await page.getByRole('button', { name: `Switch to ${start} mode` }).click();
    await expectTheme(page, start);
  });
});
