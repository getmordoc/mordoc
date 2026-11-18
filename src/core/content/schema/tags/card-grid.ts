import type { Schema } from '@markdoc/markdoc';

/** The most columns a card grid can have; more makes the cards too narrow. */
export const CARD_GRID_MAX_COLUMNS = 4;

/**
 * CardGrid tag — responsive grid container for card tags.
 *
 * `cols` controls the number of columns, from 1 to `CARD_GRID_MAX_COLUMNS`
 * (default 3). Validation allows no other value, so the component uses it
 * as it is. The grid collapses responsively: 2-col at medium viewports,
 * 1-col at small.
 * Authors use: {% cardGrid cols="3" %}...{% /cardGrid %}
 */
export const cardGrid: Schema = {
  render: 'CardGrid',
  inline: false,
  children: ['tag'],
  attributes: {
    cols: {
      type: String,
      default: '3',
      matches: Array.from({ length: CARD_GRID_MAX_COLUMNS }, (_, i) => String(i + 1)),
    },
  },
};
