import type { Schema } from '@markdoc/markdoc';

/**
 * Routes Markdown images to the Image React component, a plain <img>.
 * Markdoc's built-in image node provides `src`, `alt`, and `title` attributes.
 */
export const image: Schema = {
  render: 'Image',
  attributes: {
    src: { type: String },
    alt: { type: String },
    title: { type: String },
  },
};
