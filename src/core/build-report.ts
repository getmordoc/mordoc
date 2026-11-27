import path from 'node:path';
import type { ValidationError } from '@markdoc/markdoc';

/** Something an author has to fix or know about, with the same levels as Markdoc's. */
export interface BuildProblem {
  /** Absolute path of the file; a problem that isn't about one file has none. */
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
 * Formats the place of a problem: the file relative to the project, and the
 * line when there is one. A problem without a file has no place.
 *
 * Example: `content/en/guide/setup.md:12`
 */
function formatLocation(problem: BuildProblem, projectRoot: string): string | null {
  if (!problem.file) return null;
  const file = path.relative(projectRoot, problem.file).replace(/\\/g, '/');
  return problem.line === undefined ? file : `${file}:${problem.line}`;
}

/**
 * Formats one problem as one line: its place when it has one, the level and
 * the message.
 *
 * Example: `content/en/guide/setup.md:12  error  Undefined variable: 'productName'`
 */
function formatProblem(problem: BuildProblem, projectRoot: string): string {
  const location = formatLocation(problem, projectRoot);
  const text = `${problem.level}  ${problem.message}`;
  return location ? `${location}  ${text}` : text;
}

/**
 * Describes a thrown error for the author: its message, or its stack with
 * `verbose`. A thrown error doesn't say whether it is a mistake in the site
 * or a bug in Mordoc, so the stack is only shown when asked for.
 */
export function describeError(error: unknown, verbose: boolean): string {
  if (!(error instanceof Error)) return String(error);
  return verbose ? (error.stack ?? error.message) : error.message;
}

/**
 * Collects the problems of one run, so the author gets them as one list. The
 * checks find the problems; the report only keeps and prints them.
 *
 * A check adds every problem in the site here, and never prints it to the
 * console itself: the console is only for Mordoc's own messages, such as
 * progress. A check throws only when the run can't go on; `runPipeline` then
 * adds the error with `addLegacyError`.
 *
 * Create a new one for every run: it starts empty, so a run never shows the
 * problems of an earlier one.
 */
export class BuildReport {
  private readonly problems: BuildProblem[] = [];

  /**
   * @param verbose - Adds the stack of a thrown error, for finding a bug in
   *   Mordoc.
   */
  constructor(
    private readonly projectRoot: string,
    private readonly verbose = false,
  ) {}

  add(problem: BuildProblem): void {
    this.problems.push(problem);
  }

  /**
   * Adds an error that an older check threw instead of adding its problem.
   * Its message already names the file.
   */
  addLegacyError(error: unknown): void {
    this.add({ level: 'error', message: describeError(error, this.verbose) });
  }

  /** The number of problems that stop `mordoc build`. */
  get errorCount(): number {
    return this.problems.filter((problem) => BLOCKING_LEVELS.has(problem.level)).length;
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
    if (this.errorCount > 0) throw new ValidationFailedError(this.errorCount);
  }
}

/**
 * Thrown to stop a run when the report has errors: by `mordoc build`, and by
 * any run whose stages threw. The errors themselves are already listed for
 * the author, so the CLI prints only this message, without a stack trace.
 */
export class ValidationFailedError extends Error {
  constructor(errorCount: number) {
    const noun = errorCount === 1 ? 'error' : 'errors';
    super(`Your content has ${errorCount} ${noun}, listed above. Fix them and build again.`);
    this.name = 'ValidationFailedError';
  }
}
