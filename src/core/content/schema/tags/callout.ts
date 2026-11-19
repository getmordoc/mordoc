import type { Schema } from '@markdoc/markdoc';

/**
 * Callout block tag — renders note, warning, danger, and tip callout boxes.
 *
 * Authors use: {% callout type="note" title="..." %}...{% /callout %}
 * The `children` array lists the Markdoc node types allowed inside, keeping
 * callout content intentionally limited (no nested headings or images).
 */
export const callout: Schema = {
  render: 'Callout',
  inline: false,
  children: ['paragraph', 'list', 'fence', 'blockquote'],
  attributes: {
    type: { type: String, default: 'note', matches: ['note', 'warning', 'danger', 'tip'] },
    title: { type: String },
  },
};
