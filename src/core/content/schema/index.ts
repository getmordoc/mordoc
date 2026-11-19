import type { Config, Schema } from '@markdoc/markdoc';
import * as nodes from './nodes/index.js';
import {
  accordion,
  accordions,
  advancedImage,
  button,
  callout,
  card,
  cardGrid,
  clip,
  column,
  columns,
  hero,
  image,
  link,
  params,
  section,
  videoEmbed,
} from './tags/index.js';

/**
 * The tags every page can use: article pages, landing pages, and the texts
 * for the API reference. It matches `contentComponents`, the components
 * those pages render with.
 */
const articleTags: Record<string, Schema> = {
  callout,
  card,
  cardGrid,
  button,
  link,
  image,
  advancedImage,
  clip,
  videoEmbed,
  accordion,
  accordions,
  column,
  columns,
  params,
};

/**
 * The tags a landing page can use: every article tag, plus `hero` and
 * `section`, as a landing page renders with `contentComponents` plus `Hero`
 * and `Section`.
 */
const landingTags: Record<string, Schema> = { ...articleTags, hero, section };

/**
 * The Markdoc config for article pages, and the base for the API reference
 * texts. A tag that is not in it, such as `hero`, is reported by Markdoc as
 * an undefined tag.
 */
export function createArticleMarkdocConfig(): Config {
  return createMarkdocConfig(articleTags);
}

/** The Markdoc config for pages with `layout: landing` in their frontmatter. */
export function createLandingMarkdocConfig(): Config {
  return createMarkdocConfig(landingTags);
}

function createMarkdocConfig(tags: Record<string, Schema>): Config {
  assertEveryTagStatesPlacement(tags);
  return {
    nodes: { heading: nodes.heading, link: nodes.link, fence: nodes.fence, image: nodes.image },
    tags,
  };
}

/**
 * Every tag must say where it may stand: `inline: false` for a block, or an
 * explicit `inline: undefined` for a tag that may also go inside a sentence
 * or a link. Validation can only report a tag in the wrong place if its
 * schema says so, so a tag that forgets it would let broken pages through.
 */
function assertEveryTagStatesPlacement(tags: Record<string, Schema>): void {
  const missing = Object.keys(tags).filter((name) => !Object.hasOwn(tags[name]!, 'inline'));
  if (missing.length > 0) {
    throw new Error(
      `mordoc: these tags don't state where they may stand (inline): ${missing.join(', ')}`,
    );
  }
}
