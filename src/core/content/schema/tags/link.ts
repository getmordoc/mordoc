import Markdoc from '@markdoc/markdoc';
import type { Schema } from '@markdoc/markdoc';
import { notInsideClickable } from '../../validation.js';

/**
 * Link tag — variable-capable counterpart to the plain `[text](url)` syntax.
 *
 * Markdoc parses a Markdown link's destination as a raw string, so a `$VAR`
 * inside `[text]($VAR)` is never resolved against `config.variables` (this
 * is a documented Markdoc limitation, not a Mordoc bug). Authors who need a
 * variable in a link target use this tag instead:
 * `{% link path=$VAR %}Text{% /link %}`.
 *
 * Renders through the same ContentLink component as the native `link` node, so SPA-routing behavior is identical regardless of which syntax
 * produced it. The attribute is named `path` (matching the `button` tag's
 * convention) rather than `href`, so it's renamed back to `href` here before
 * building the Tag.
 *
 * Allows the same children as the `link` node, so both syntaxes accept
 * the same content.
 */
export const link: Schema = {
  render: 'ContentLink',
  inline: undefined,
  children: ['strong', 'em', 's', 'code', 'text', 'tag'],
  attributes: {
    path:  { type: String, required: true },
    title: { type: String },
  },
  transform(node, config) {
    const { path, ...rest } = node.transformAttributes(config) as Record<string, unknown>;
    const children = node.transformChildren(config);
    return new Markdoc.Tag('ContentLink', { ...rest, href: path }, children);
  },
  validate: notInsideClickable('link'),
};
