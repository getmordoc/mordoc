import type { Schema } from '@markdoc/markdoc';

/**
 * Image tag — variable-capable counterpart to the plain `![alt](src)` syntax.
 *
 * Same limitation as the `link` tag: `![alt]($VAR)`'s destination is a
 * raw string, so `$VAR` never resolves there. Authors who need a variable in
 * an image source use this tag instead: `{% image src=$VAR alt="..." /%}`.
 *
 * Self-closing — `alt`/`title` are attributes, not children, because `<img>`
 * is a void element and can't render nested content. `children: []` enforces
 * that at validation time rather than leaving it merely unused.
 *
 * Renders through the same Image component as the native `image` node.
 */
export const image: Schema = {
  render: 'Image',
  inline: undefined,
  children: [],
  attributes: {
    src: { type: String, required: true },
    alt: { type: String },
    title: { type: String },
  },
};
