import Markdoc from '@markdoc/markdoc';
import type { Config, Node, Schema, ValidateError } from '@markdoc/markdoc';
import type { BuildProblem, BuildReport } from '../build-report.js';

/*
 * Mordoc works with Markdoc's own validation results: `Markdoc.validate()`
 * returns a list of `ValidateError`s, each holding a `ValidationError` (its
 * level, from `warning` to `critical`, and its message) and the location it
 * was found at. Texts are parsed with their file path, so the location names
 * the file. Markdoc never throws for validation; Mordoc decides what to do
 * with the list.
 */

/**
 * A link or button can't sit inside another link or button: one click can
 * only go to one place, and HTML doesn't allow it either. Markdoc lets any
 * tag sit inside a link, so the link node, the link tag and the button tag
 * each use this rule as their `validate()`, which gets the parents Markdoc
 * passes along as `config.validation.parents`.
 */
export function notInsideClickable(what: string): Schema['validate'] {
  return (_node, config) => {
    const parents = config.validation?.parents ?? [];
    const insideClickable = parents.some(
      (parent) =>
        parent.type === 'link' ||
        (parent.type === 'tag' && (parent.tag === 'link' || parent.tag === 'button')),
    );
    if (!insideClickable) return [];
    return [
      {
        id: 'clickable-inside-clickable',
        level: 'critical',
        message: `A ${what} can't be placed inside a link or a button, because one click can only go to one place.`,
      },
    ];
  };
}

function toBuildProblem(result: ValidateError): BuildProblem {
  return {
    file: result.location?.file,
    // Markdoc counts lines from 0; editors count from 1.
    line: (result.location?.start.line ?? result.lines[0] ?? 0) + 1,
    level: result.error.level,
    message: result.error.message,
  };
}

/**
 * Validates Markdoc texts — the pages and the texts for the API reference —
 * and adds the results to the report of the run.
 */
export class ContentValidator {
  constructor(private readonly report: BuildReport) {}

  /** Validates one parsed text with the config it will be transformed with. */
  validate(ast: Node, config: Config): void {
    for (const result of Markdoc.validate(ast, config)) this.report.add(toBuildProblem(result));
  }
}
