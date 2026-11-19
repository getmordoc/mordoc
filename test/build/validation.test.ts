import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../../bin/cli.js', import.meta.url));

/** A reported problem, as `mordoc build` prints it: `file:line  level  message`. */
const PROBLEM_LINE = /^\S+:\d+ {2}(?:debug|info|warning|error|critical) {2}.+$/;

interface BuildResult {
  exitCode: number | null;
  problems: string[];
}

/** Builds the site in `dir` with the Mordoc command line and collects the reported problems. */
function build(dir: string): BuildResult {
  const result = spawnSync(process.execPath, [cli, 'build'], { cwd: dir, encoding: 'utf-8' });
  // Node could not start the build at all, so there is no output to compare.
  if (result.error) throw result.error;
  const problems = `${result.stdout}\n${result.stderr}`
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => PROBLEM_LINE.test(line));
  return { exitCode: result.status, problems };
}

/** Reads the problems a test site is expected to report, one per line, whatever the line endings. */
function expectedProblems(dir: string): string[] {
  return readFileSync(path.join(dir, 'expected.txt'), 'utf-8')
    .split(/\r?\n/)
    .filter((line) => line !== '');
}

// Sorted, so the order in which Mordoc reports the problems doesn't matter.
const sorted = (lines: string[]): string[] => [...lines].sort();

test('a site with errors stops the build and reports every problem', () => {
  const dir = fileURLToPath(new URL('./errors', import.meta.url));
  const { exitCode, problems } = build(dir);

  assert.deepEqual(sorted(problems), sorted(expectedProblems(dir)));
  assert.equal(exitCode, 1);
});
