# Modernize Mordoc's default look and feel: Tasks

**Change:** `mordoc-changes-store/changes/feat-modern-look-and-feel`
**QA plan:** [qa.md](./qa.md)

## Tasks
- [x] **T-001 (FR-001):** Show top-level sidebar groups without a page as categories, with a line above each from the second item on.
- [x] **T-002 (FR-002):** Show sidebar pages in regular weight and the current page without a background.
- [x] **T-003 (FR-003):** Draw a line above each main heading that does not start the page.
- [x] **T-004 (FR-004):** Set the new sizes and colors of the page title, intro, headings, body text and "On this page" list.
- [x] **T-005 (FR-005):** Give code blocks a darker grey title bar, light code in light mode and dark code in dark mode, with highlight colors for each.
- [x] **T-006 (FR-006):** Check that the accent color and all existing style settings still work.
- [x] **T-007 (FR-006):** Make the code highlight colors, the category title color and weight, and the heading line color settings.
- [x] **T-008 (FR-007):** Give the header and the hero banner their own light grey defaults, with a darker hero description.
- [x] **T-009 (NFR-003):** Swap each color within a CIEDE2000 difference of 3 for its exact Material Design value.
- [x] **T-010 (FR-008):** Show the loading placeholder as grey bars with a lighter band moving across, with settings for both colors.
- [x] **T-011 (FR-009):** Use each system's own code font for code: Menlo, Consolas, then the generic fallback.
