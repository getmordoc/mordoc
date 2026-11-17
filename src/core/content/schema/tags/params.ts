import type { Schema } from '@markdoc/markdoc';

/**
 * Params tag — the container for API field entries in an enrichment file.
 *
 * ```markdown
 * {% params %}                              ← parameters + request body
 * {% params in="response" status="402" %}   ← one response
 * {% params mode="replace" %}               ← the rare full override
 * ```
 *
 * The wrapper exists because an operation file mixes narrative prose and
 * field entries, and telling them apart by heading level alone would mean a
 * writer using `###` in ordinary prose silently creates a bogus field entry.
 * `mode` sits on the container rather than on each entry: two lines per
 * file, not two per field.
 *
 * Registered here purely so the attribute declarations below make a typo in
 * `in` or `mode` catchable rather than silently ignored — this tag isn't
 * part of the documented authoring surface for ordinary content. No
 * `transform` or `render` is declared: in an enrichment file the tag is
 * consumed at the AST level, before transform — `core/openapi/enrichment-parser.ts`
 * splits the block on its `###` headings and uses each as a lookup key, so
 * those headings never become `Heading` tags and never reach the TOC, and
 * `Markdoc.transform()` never runs on this node in that path. If a
 * `{% params %}` block ever ends up outside an enrichment file — undocumented
 * usage, not a supported case — Markdoc's own default for a tag with neither
 * `transform` nor `render` already renders its children unwrapped, which is
 * plain, unremarkable behavior for a tag nobody is told to use.
 */
export const params: Schema = {
  inline: false,
  children: ['heading', 'paragraph', 'list', 'fence', 'blockquote', 'tag', 'hr'],
  attributes: {
    in:     { type: String, default: 'request', matches: ['request', 'response'] },
    status: { type: String },
    mode:   { type: String, default: 'append', matches: ['append', 'replace'] },
  },
};
