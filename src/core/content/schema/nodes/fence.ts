import Markdoc from '@markdoc/markdoc';
import type { Config, Node, Schema } from '@markdoc/markdoc';
import { buildScene } from '../../diagrams/build-scene.js';

/**
 * The text a code block shows.
 *
 * Markdoc processes the variables and tags in a code block into its children
 * while parsing. Those produce text, which is joined back into one string for
 * highlighting and copying. Without processed text, or when `process` is
 * false, the code block shows its `content` as written.
 */
function codeBlockContent(node: Node, config: Config, process: boolean): string {
  const raw = typeof node.attributes['content'] === 'string' ? node.attributes['content'] : '';
  const hasProcessedText = process && node.children.length > 0;
  if (!hasProcessedText) return raw;

  const parts = node.transformChildren(config);
  // A component, such as a callout, cannot be shown inside a code block yet.
  if (parts.some((part) => Markdoc.Tag.isTag(part))) return raw;

  return parts.map((part) => (part === null || part === undefined ? '' : String(part))).join('');
}

/**
 * Routes fenced code blocks to the CodeBlock React component — except for
 * diagram fences (```sequence-diagram, and any future ```<type>-diagram),
 * which are parsed and laid out right here, once, at build time.
 *
 * A diagram fence's raw text is turned into a flat, JSON-serializable `Scene`
 * (see `core/content/diagrams/build-scene.ts`) and wrapped as a `Diagram` tag;
 * the diagram engine's parser/layout code itself never reaches the client
 * bundle, only its `Scene` output does. An invalid diagram throws here, which
 * fails the build with a clear error rather than shipping a broken page.
 *
 * Every other fenced language falls through to the CodeBlock component.
 *
 * Like Markdoc's own `fence` node, a code block is processed: variables and
 * tags inside it are evaluated, unless the author writes
 * ```lang {% process=false %} to show it exactly as written. See
 * `codeBlockContent()` for how the processed result becomes text.
 *
 * `process` is not rendered to the page: the transform below builds the
 * `CodeBlock` from `language` and `content` only. It is left renderable so
 * `transformAttributes` hands it over with its default applied.
 */
export const fence: Schema = {
  render: 'CodeBlock',
  attributes: {
    language: { type: String },
    content:  { type: String, render: true },
    process:  { type: Boolean, default: true },
  },
  transform(node, config) {
    const attributes = node.transformAttributes(config);
    const language = typeof attributes['language'] === 'string' ? attributes['language'] : '';
    const content = codeBlockContent(node, config, attributes['process'] !== false);

    if (language.endsWith('-diagram')) {
      const scene = buildScene(language, content);
      return new Markdoc.Tag('Diagram', { scene }, []);
    }

    return new Markdoc.Tag('CodeBlock', { language, content }, []);
  },
};
