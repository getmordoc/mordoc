import type { Schema } from '@markdoc/markdoc';

/**
 * Section tag — full-width landing page content block.
 *
 * Optional `title` renders an <h2>. `background` accepts an image path or
 * URL only — solid background color is a design decision owned by
 * Section.module.css's --section-bg token, not a markdown attribute.
 * Authors use: {% section title="..." background="/images/foo.jpg" %}...{% /section %}
 */
export const section: Schema = {
  render: 'Section',
  inline: false,
  children: ['heading', 'paragraph', 'list', 'fence', 'blockquote', 'tag', 'hr'],
  attributes: {
    title: { type: String },
    background: { type: String },
  },
};
