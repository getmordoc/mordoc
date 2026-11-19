import type { Schema } from '@markdoc/markdoc';

/**
 * VideoEmbed tag — a video hosted on YouTube, Vimeo, Loom, or another
 * recognized provider (as opposed to `clip`'s self-hosted file). See the
 * VideoEmbed component's own doc comment for the full reasoning; summary
 * here:
 *
 * `src` is the video's ordinary public page URL — whatever an author would
 * paste from their browser, in any of that provider's URL shapes
 * (`youtube.com/watch?v=`, `youtu.be/`, `vimeo.com/`, `loom.com/share/`,
 * …). `providers.ts` resolves it to a provider name + iframe embed URL; an
 * unrecognized host or an unparseable video ID falls back to a plain
 * link-out card rather than a broken iframe.
 *
 * For a recognized provider, that iframe is mounted immediately and
 * unconditionally — no author-supplied `thumbnail` needed, because
 * YouTube/Vimeo/Loom's own players already render a real thumbnail + play
 * button the instant they load. `thumbnail` (optional, same name and role
 * as `clip.thumbnail`) only does anything in the *unrecognized*-provider
 * case: omit it there and readers get a generic branded fallback card
 * instead of a real screenshot. See the component doc comment for the
 * trade-off this implies (every recognized-provider embed now pays that
 * provider's player-JS weight on page load, not just on click).
 *
 * `aspectRatio` (optional, e.g. `"4 / 3"`, `"9 / 16"`) overrides the 16:9
 * default box. Mainly needed for Loom, whose recordings inherit whatever
 * shape the recorder's screen/window was rather than a fixed video ratio.
 *
 * Self-closing, same reasoning as `clip`/`image`.
 *
 * Authors use: {% videoEmbed src="https://youtu.be/dQw4w9WgXcQ" title="..." /%}
 */
export const videoEmbed: Schema = {
  render: 'VideoEmbed',
  inline: false,
  children: [],
  attributes: {
    src: { type: String, required: true },
    thumbnail: { type: String },
    title: { type: String },
    alt: { type: String },
    aspectRatio: { type: String },
  },
};
