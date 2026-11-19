import type { Schema } from '@markdoc/markdoc';

/**
 * Advanced image tag — an image with a visible caption, which opens larger
 * when clicked: `{% advancedImage src="..." alt="..." caption="..." /%}`.
 *
 * It renders a <figure>, a block element, and HTML allows no block element
 * inside a paragraph, so it can only stand on its own line, like every other
 * block tag.
 *
 * `caption` (not `title`) because it is visible text below the image, where
 * an image's `title` only shows when hovering.
 */
export const advancedImage: Schema = {
  render: 'AdvancedImage',
  children: [],
  inline: false,
  attributes: {
    src: { type: String, required: true },
    alt: { type: String },
    caption: { type: String },
  },
};
