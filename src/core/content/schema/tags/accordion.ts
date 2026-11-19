import type { Schema } from '@markdoc/markdoc';

/**
 * Accordion tag — a single collapsible section: `title` drives the
 * clickable header, and the body accepts the same broad content model as
 * `section` (headings, paragraphs, lists, code fences, images, and any
 * nested custom tag), so authors can put callouts, clips, embeds, cards —
 * even another accordion — inside it, same as writing plain article body
 * content.
 *
 * Works standalone, or nested inside `accordions` for grouped/coordinated
 * behavior — see the `accordions` tag and the Accordion component's own doc
 * comment for the mechanism.
 *
 * Authors use: {% accordion title="..." %}...{% /accordion %}
 */
export const accordion: Schema = {
  render: 'Accordion',
  inline: false,
  children: ['heading', 'paragraph', 'list', 'fence', 'blockquote', 'tag', 'hr'],
  attributes: {
    title: { type: String, required: true },
    defaultOpen: { type: Boolean, default: false },
  },
};
