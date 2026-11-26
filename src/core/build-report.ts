import path from 'node:path';
import type { ValidationError } from '@markdoc/markdoc';

/** Something an author has to fix or know about, with the same levels as Markdoc's. */
export interface BuildProblem {
  /** Absolute path of the file, when it is known. */
  file?: string;
  /** The line as editors count it; a problem with the file itself has none. */
  line?: number;
  level: ValidationError['level'];
  message: string;
}

/**
 * Levels that stop `mordoc build`. Warnings are only reported: some of them
 * come from nesting rules rather than from broken content, and the page
 * still renders.
 */
const BLOCKING_LEVELS: ReadonlySet<BuildProblem['level']> = new Set(['error', 'critical']);

/**
 * Formats one problem as one line: the file relative to the project, the line
 * when there is one, the level and the message.
 *
 * Example: `content/en/guide/setup.md:12  error  Undefined variable: 'productName'`
 */
function formatProblem(problem: BuildProblem, projectRoot: string): string {
  const file = problem.file
    ? path.relative(projectRoot, problem.file).replace(/\\/g, '/')
    : '(unknown file)';
  const location = problem.line === undefined ? file : `${file}:${problem.line}`;
  return `${location}  ${problem.level}  ${problem.message}`;
}

/**
 * Collects the problems of one run, so the author gets them as one list. The
 * checks find the problems; the report only keeps and prints them.
 *
 * Create a new one for every run: it starts empty, so a run never shows the
 * problems of an earlier one.
 */
export class BuildReport {
  private readonly problems: BuildProblem[] = [];

  constructor(private readonly projectRoot: string) {}

  add(problem: BuildProblem): void {
    this.problems.push(problem);
  }

  /** Prints every problem, one per line under a short heading, in one go. */
  print(): void {
    if (this.problems.length === 0) return;
    const noun = this.problems.length === 1 ? 'problem' : 'problems';
    const lines = [
      '',
      `  Mordoc found ${this.problems.length} ${noun} in your content:`,
      '',
      ...this.problems.map((problem) => `  ${formatProblem(problem, this.projectRoot)}`),
      '',
    ];
    console.log(lines.join('\n'));
  }

  /** Throws a `ValidationFailedError` when a problem is an error. */
  stopOnErrors(): void {
    const blocking = this.problems.filter((problem) => BLOCKING_LEVELS.has(problem.level)).length;
    if (blocking > 0) throw new ValidationFailedError(blocking);
  }
}

/**
 * Thrown by `mordoc build` to stop when the report has errors. The errors
 * themselves are already listed for the author, so the CLI prints only this
 * message, without a stack trace.
 */
export class ValidationFailedError extends Error {
  constructor(errorCount: number) {
    const noun = errorCount === 1 ? 'error' : 'errors';
    super(`Your content has ${errorCount} ${noun}, listed above. Fix them and build again.`);
    this.name = 'ValidationFailedError';
  }
}
