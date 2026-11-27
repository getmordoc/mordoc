import type { Schema } from '@markdoc/markdoc';
import { notInsideClickable } from '../../content-validator.js';

/**
 * Button tag — styled CTA link, usable in landing pages and content pages.
 *
 * Internal paths use React Router Link; external URLs open in a new tab.
 * Authors use: {% button path="..." %}Label{% /button %}
 */
export const button: Schema = {
  render: 'Button',
  inline: undefined,
  children: ['paragraph', 'inline', 'text', 'strong', 'em'],
  attributes: {
    path: { type: String, required: true },
    variant: { type: String, default: 'primary', matches: ['primary', 'secondary'] },
  },
  validate: notInsideClickable('button'),
};
