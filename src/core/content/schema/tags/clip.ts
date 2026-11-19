import type { Schema } from '@markdoc/markdoc';

/**
 * Clip tag — muted, looping demo clips, the recommended replacement for
 * animated GIFs in content.
 *
 * Named `clip` (not `video`) to leave `video` free for a future long-form,
 * audible tutorial-video tag with native player controls — a different job
 * with different defaults (no forced mute, no autoplay-on-click, real
 * scrubbing) that this component deliberately doesn't try to do.
 *
 * A plain `<img src="*.gif">` autoplays with no way to pause it, which fails
 * WCAG 2.2.2 (moving content lasting more than 5s needs a pause mechanism)
 * and reads as "crowded" next to prose. `<video>` doesn't have that problem
 * because `HTMLVideoElement` has a real `play()`/`pause()`, so the Clip
 * component renders paused on `thumbnail` by default and toggles playback on
 * click, instead of autoplaying like a GIF would.
 *
 * `src` (not `path`) because this is a resource the browser loads directly, the
 * same category as the `image` tag's `src` — not a navigable destination like
 * `link`/`button`/`card`'s `path`, which get routed through `isExternal()`.
 *
 * `thumbnail` (not `poster`, though it maps to the native `<video poster>`
 * attribute under the hood) — "poster" is filmmaking jargon; "thumbnail" is
 * what content authors actually call this, and it's the same name used by
 * the `videoEmbed` tag, which has no native `poster` attribute to
 * mirror at all since it isn't a real `<video>` element.
 *
 * Self-closing, same reasoning as the `image` tag: `thumbnail`/`title`/`alt`
 * are attributes, not children — a clip embed has no nested content to parse.
 *
 * Authors use: {% clip src="/videos/demo.mp4" thumbnail="/images/demo-thumb.jpg" title="..." /%}
 */
export const clip: Schema = {
  render: 'Clip',
  inline: false,
  children: [],
  attributes: {
    src: { type: String, required: true },
    thumbnail: { type: String },
    title: { type: String },
    alt: { type: String },
  },
};
