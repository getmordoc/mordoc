import type { Schema } from '@markdoc/markdoc';

/**
 * Hero tag — full-width landing page hero section.
 *
 * Layout is inferred: `image` present → split (text + image), absent → centered.
 * `background` accepts an image path or URL only — solid background color
 * and all text colors are design decisions owned by Hero.module.css's
 * tokens, not markdown attributes.
 * CTA buttons are passed as children ({% button %} tags).
 * Authors use: {% hero title="..." description="..." image="..." background="..." %}
 *   {% button path="..." %}Label{% /button %}
 * {% /hero %}
 */
export const hero: Schema = {
  render: 'Hero',
  inline: false,
  children: ['tag', 'paragraph'],
  attributes: {
    title: { type: String, required: true },
    titleAccent: { type: String },
    description: { type: String },
    image: { type: String },
    background: { type: String },
  },
};
