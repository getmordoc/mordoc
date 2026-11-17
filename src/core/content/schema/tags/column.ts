import type { Schema } from '@markdoc/markdoc';

/**
 * Column tag — a single column inside `columns`.
 *
 * No attributes: content accepts the same broad model as `section`/
 * `accordion` (headings, paragraphs, lists, code fences, images, and any
 * nested custom tag), so a column reads exactly like normal article content.
 *
 * Authors use: {% column %}...{% /column %}, nested inside `columns`.
 */
export const column: Schema = {
  render: 'Column',
  inline: false,
  children: ['heading', 'paragraph', 'list', 'fence', 'blockquote', 'tag', 'hr'],
};
