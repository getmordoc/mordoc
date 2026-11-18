/**
 * The one reserved badge keyword. OpenAPI cannot express every conditional
 * rule, so a writer marks such a field `conditional` and Mordoc renders it
 * with a dedicated style (and requires an explanation — see
 * `checkConditionalBadges`). Matched case-insensitively; normalized to this
 * lowercase form at parse time.
 */
export const CONDITIONAL_BADGE = 'conditional';
