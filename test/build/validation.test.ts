import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../../bin/cli.js', import.meta.url));

/** A reported problem, as Mordoc prints it: `file:line  level  message`. */
const PROBLEM_LINE = /^\S+:\d+ {2}(?:debug|info|warning|error|critical) {2}.+$/;

/** The problems in what Mordoc printed. */
function problemsIn(output: string): string[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => PROBLEM_LINE.test(line));
}

interface BuildResult {
  exitCode: number | null;
  output: string;
  problems: string[];
}

/** Builds the site in `dir` with the Mordoc command line and collects the reported problems. */
function build(dir: string): BuildResult {
  const result = spawnSync(process.execPath, [cli, 'build'], { cwd: dir, encoding: 'utf-8' });
  // Node could not start the build at all, so there is no output to compare.
  if (result.error) throw result.error;
  const output = `${result.stdout}\n${result.stderr}`;
  return { exitCode: result.status, output, problems: problemsIn(output) };
}

/** A test site in `test/build/`. */
const testSite = (name: string): string => fileURLToPath(new URL(`./${name}`, import.meta.url));

/** Reads the problems a test site is expected to report, one per line, whatever the line endings. */
function expectedProblems(dir: string): string[] {
  return readFileSync(path.join(dir, 'expected.txt'), 'utf-8')
    .split(/\r?\n/)
    .filter((line) => line !== '');
}

// Sorted, so the order in which Mordoc reports the problems doesn't matter.
const sorted = (lines: string[]): string[] => [...lines].sort();

test('a site with errors stops the build and reports every problem once', () => {
  const dir = testSite('errors');
  const { exitCode, problems } = build(dir);

  assert.deepEqual(sorted(problems), sorted(expectedProblems(dir)));
  assert.equal(exitCode, 1);
});

test('the problems are reported before an OpenAPI file that cannot be loaded stops the build', () => {
  const dir = testSite('missing-api');
  const { exitCode, output, problems } = build(dir);

  assert.deepEqual(problems, expectedProblems(dir));
  assert.ok(output.indexOf(problems[0]) < output.indexOf('missing.yaml'), output);
  assert.equal(exitCode, 1);
});

/** Copies a test site, without its build output, to a folder that is removed when the test ends. */
function copySite(t: TestContext, name: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), `mordoc-${name}-`));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const skipped = new Set(['dist', 'node_modules']);
  cpSync(testSite(name), dir, {
    recursive: true,
    filter: (source) => !skipped.has(path.basename(source)),
  });
  return dir;
}

/** How long the preview prints nothing before a test takes it as done, in milliseconds. */
const QUIET_MS = 500;

/** How long a test waits for the preview before it fails, in milliseconds. */
const TIMEOUT_MS = 20_000;

/** What the preview prints when it has handled a change, whether that worked or failed. */
const CHANGE_HANDLED = /back in sync|watch update failed/;

interface Preview {
  /** The problems printed when the preview started. */
  startProblems: string[];
  /** Makes a change in the site, and gives the problems that the preview prints for it. */
  problemsAfter: (change: () => void) => Promise<string[]>;
  /** Says whether the preview still serves the site. */
  answers: () => Promise<boolean>;
}

/** Starts `mordoc dev` on the site in `dir`; it stops when the test ends. */
async function startPreview(t: TestContext, dir: string): Promise<Preview> {
  const server = spawn(process.execPath, [cli, 'dev'], { cwd: dir });
  t.after(() => server.kill());
  let output = '';
  let lastOutputAt = Date.now();
  for (const stream of [server.stdout, server.stderr]) {
    stream.on('data', (data: Buffer) => {
      output += data.toString();
      lastOutputAt = Date.now();
    });
  }

  const isQuiet = () => Date.now() - lastOutputAt > QUIET_MS;
  const waitUntil = async (isDone: () => boolean, what: string): Promise<void> => {
    const start = Date.now();
    while (!isDone()) {
      if (Date.now() - start > TIMEOUT_MS) throw new Error(`${what} took too long:\n${output}`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  const ADDRESS = /http:\/\/localhost:\d+/;
  await waitUntil(() => ADDRESS.test(output) || server.exitCode !== null, 'Starting the preview');
  await waitUntil(isQuiet, 'Starting the preview');
  const [address] = ADDRESS.exec(output) ?? [];
  if (!address) throw new Error(`The preview stopped:\n${output}`);

  return {
    startProblems: problemsIn(output),
    problemsAfter: async (change) => {
      const start = output.length;
      change();
      const printed = () => output.slice(start);
      await waitUntil(() => CHANGE_HANDLED.test(printed()) && isQuiet(), 'The change');
      return problemsIn(printed());
    },
    answers: async () => (await fetch(address)).ok,
  };
}

test('the preview reports each problem once, when it starts and after a change', async (t) => {
  const dir = copySite(t, 'errors');
  const preview = await startPreview(t, dir);
  assert.deepEqual(sorted(preview.startProblems), sorted(expectedProblems(dir)));

  const page = path.join(dir, 'content/en/unknown-tag.md');
  const saved = await preview.problemsAfter(() =>
    writeFileSync(page, `${readFileSync(page, 'utf-8')}\n{% box %}Text{% /box %}\n`),
  );
  const boxProblem = "content/en/unknown-tag.md:9  critical  Undefined tag: 'box'";
  assert.deepEqual(saved, [
    "content/en/unknown-tag.md:5  critical  Undefined tag: 'banner'",
    boxProblem,
  ]);

  const apiRegistry = path.join(dir, 'config/api.yaml');
  const failed = await preview.problemsAfter(() =>
    writeFileSync(
      apiRegistry,
      `${readFileSync(apiRegistry, 'utf-8')}  - id: gone\n    spec: missing.yaml\n`,
    ),
  );
  assert.deepEqual(sorted(failed), sorted([...expectedProblems(dir), boxProblem]));
  assert.ok(await preview.answers());
});
