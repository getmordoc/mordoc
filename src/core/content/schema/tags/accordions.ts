import type { Schema } from '@markdoc/markdoc';

/**
 * Accordions tag — optional group wrapper for several `accordion` tags.
 *
 * Makes the group exclusive: opening one item closes any other open item
 * in the group. See the Accordions component's own doc comment for how
 * this is implemented with no JS via native `<details name="...">`.
 *
 * Authors use:
 *   {% accordions %}
 *     {% accordion title="..." %}...{% /accordion %}
 *     {% accordion title="..." %}...{% /accordion %}
 *   {% /accordions %}
 */
export const accordions: Schema = {
  render: 'Accordions',
  inline: false,
  children: ['tag'],
};
