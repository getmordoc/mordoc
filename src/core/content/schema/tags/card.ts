import type { Schema } from '@markdoc/markdoc';

/**
 * Card tag — a single card with optional icon, image, link, and badge.
 *
 * Variant is inferred from attributes: `image` → image card, `icon` → icon
 * card, neither → plain. Self-closing (no body) → compact mode.
 * Authors use: {% card title="..." path="..." icon="..." %}Description{% /card %}
 * Must be used inside {% cardGrid %}.
 */
export const card: Schema = {
  render: 'Card',
  inline: false,
  children: ['paragraph', 'inline', 'list'],
  attributes: {
    title: { type: String, required: true },
    path:  { type: String },
    icon:  { type: String },
    image: { type: String },
    tag:   { type: String },
  },
};
