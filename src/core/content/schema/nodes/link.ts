import type { Schema } from '@markdoc/markdoc';
import { notInsideClickable } from '../../validation.js';

/**
 * Custom link node — routes all Markdoc inline links to the ContentLink
 * React component, which uses React Router <Link> for internal paths and
 * a plain <a target="_blank"> for external URLs. Anchor-only links (#id)
 * pass through as plain <a> elements (in-page scroll, no routing needed).
 *
 * Without this override Markdoc emits a plain <a href="..."> for every
 * markdown link, which triggers a full browser navigation instead of
 * client-side routing.
 *
 * `children` is exactly Markdoc's own `link` node list: Mordoc allows what
 * Markdoc allows, no more and no less. So a tag (such as `{% image /%}`) may
 * sit inside a link, and a Markdown image inside a link is reported as a
 * warning, as Markdoc reports it.
 */
export const link: Schema = {
  render: 'ContentLink',
  children: ['strong', 'em', 's', 'code', 'text', 'tag'],
  attributes: {
    href: { type: String, required: true },
    title: { type: String },
  },
  validate: notInsideClickable('link'),
};
