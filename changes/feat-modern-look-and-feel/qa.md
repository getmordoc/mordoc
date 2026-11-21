# Modernize Mordoc's default look and feel: QA Plan

**Change:** `mordoc-changes-store/changes/feat-modern-look-and-feel`
**Tasks:** [tasks.md](./tasks.md)

## Test Strategy
- Compare each swapped color with its old value: the CIEDE2000 difference is at most 3, and screenshots before and after differ by no more than a few steps per color channel.
- Compare screenshots before and after of the components example site, the Mordoc documentation and the API demo, in light and dark mode, at desktop and phone width.
- Behavior must not change: `npm test` passes unchanged.
- Run `npm test`.

## Test Coverage
- **AC-001:** Screenshots of the Mordoc documentation's sidebar show a line above each category from the second item on, and category titles in capitals, larger and bolder than the pages; a category still opens and closes.
- **AC-002:** Screenshots of a page with several main headings show a line above each, and none above a heading that starts the page.
- **AC-003:** Screenshots of code blocks on a content page and an API page show a darker grey title bar, light code in light mode and dark code in dark mode; the measured contrast of the code and each highlight color is at least 4.5:1 in both modes.
- **AC-004:** Screenshots show the current sidebar page in red text without a background, in both modes.
- **AC-005:** Screenshots show the smaller page title, larger intro, softer body text and the capitals "On this page" title.
- **AC-006:** A site with style files that set the accent color, the code block and highlight colors, and the category title color and weight shows those values; without them it shows the defaults.
- **AC-007:** Screenshots show the light grey header and the slightly darker hero banner in both modes; the hero description has a contrast of at least 4.5:1; a site with style files that set other header and hero colors shows those.
- **AC-008:** Screenshots taken while a page loads, with its data held back, show grey bars with a lighter band in both modes.
- **AC-009:** The browser reports a system code font, Menlo in Chrome on macOS, as the font that draws a code block, not Courier.
