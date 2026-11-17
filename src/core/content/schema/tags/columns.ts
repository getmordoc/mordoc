import type { Schema } from '@markdoc/markdoc';

/**
 * Columns tag — lays out its `column` children side by side, equal width.
 *
 * An ordinary block-level tag, so it needs no special handling to appear
 * mid-page: normal content, then a `{% columns %}...{% /columns %}` block,
 * then normal content again — or the author wraps the whole page body in
 * one `columns` block. Column count follows however many `column` children
 * are nested; there's no `cols` attribute to keep in sync with them.
 *
 * `divider` (default `false`) draws a vertical rule between columns.
 * Collapses to a single stacked column on narrow viewports.
 *
 * Authors use:
 *   {% columns %}
 *     {% column %}...{% /column %}
 *     {% column %}...{% /column %}
 *   {% /columns %}
 */
export const columns: Schema = {
  render: 'Columns',
  inline: false,
  children: ['tag'],
  attributes: {
    divider: { type: Boolean, default: false },
  },
};
