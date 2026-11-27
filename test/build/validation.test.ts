import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../../bin/cli.js', import.meta.url));

/**
 * A reported problem, as Mordoc prints it: `file:line  level  message`, or
 * `level  message` for a problem that isn't about one file.
 */
const PROBLEM_LINE = /^(?:\S+ {2})?(?:debug|info|warning|error|critical) {2}.+$/;

/** A line of a stack trace. */
const STACK_LINE = /^\s+at /m;

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
function build(dir: string, options: string[] = []): BuildResult {
  const result = spawnSync(process.execPath, [cli, 'build', ...options], {
    cwd: dir,
    encoding: 'utf-8',
  });
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

test('an OpenAPI file that cannot be loaded is reported in the list, without a stack', () => {
  const dir = testSite('missing-api');
  const { exitCode, output, problems } = build(dir);

  assert.deepEqual(problems, expectedProblems(dir));
  assert.match(output, /api\/specs\/missing\.yaml does not exist/);
  assert.doesNotMatch(output, STACK_LINE);
  assert.equal(exitCode, 1);
});

test('with --verbose, an error that stops the build has its stack', () => {
  const { exitCode, output } = build(testSite('missing-api'), ['--verbose']);

  assert.match(output, STACK_LINE);
  assert.equal(exitCode, 1);
});

/**
 * Copies a test site, without its build output, to a folder that is removed
 * when the test ends. Gives the folder's real path, as Mordoc sees it: on
 * macOS the temporary folder is a link.
 */
function copySite(t: TestContext, name: string): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), `mordoc-${name}-`)));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const skipped = new Set(['dist', 'node_modules']);
  cpSync(testSite(name), dir, {
    recursive: true,
    filter: (source) => !skipped.has(path.basename(source)),
  });
  return dir;
}

/** What the preview prints when it is up, after the problems of its first run. */
const PREVIEW_UP = /Mordoc dev server is up\s+→ (http:\/\/localhost:\d+)/;

/** What the preview prints when it has handled a change, after the problems of that change. */
const CHANGE_HANDLED = /back in sync|watch update failed/;

interface Preview {
  /** The problems printed when the preview started. */
  startProblems: string[];
  /** Makes a change in the site, and gives what the preview prints for it. */
  printedAfter: (change: () => void) => Promise<string>;
  /** Says whether the preview still serves the site. */
  answers: () => Promise<boolean>;
}

/**
 * Starts `mordoc dev` on the site in `dir`; it stops when the test ends. The
 * preview prints its problems and the line that ends them to stdout, so they
 * arrive in order.
 */
async function startPreview(t: TestContext, dir: string): Promise<Preview> {
  const server = spawn(process.execPath, [cli, 'dev'], { cwd: dir });
  t.after(() => server.kill());
  let output = '';
  // Only read when the preview stops, to say why.
  let errorOutput = '';
  server.stderr.on('data', (data: Buffer) => {
    errorOutput += data.toString();
  });
  const onOutput = new Set<() => void>();
  server.stdout.on('data', (data: Buffer) => {
    output += data.toString();
    for (const check of onOutput) check();
  });

  /**
   * Gives what the preview printed from `start` on, as soon as it matches
   * `pattern`. Fails when the preview stops first; a preview that hangs is
   * stopped by the test's timeout.
   */
  const printedUntil = (pattern: RegExp, start: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const stopListening = () => {
        onOutput.delete(check);
        server.off('exit', onExit);
      };
      const check = () => {
        const printed = output.slice(start);
        if (!pattern.test(printed)) return;
        stopListening();
        resolve(printed);
      };
      const onExit = () => {
        stopListening();
        reject(new Error(`The preview stopped:\n${output}\n${errorOutput}`));
      };
      onOutput.add(check);
      server.on('exit', onExit);
      check();
    });

  const started = await printedUntil(PREVIEW_UP, 0);
  const [, address] = PREVIEW_UP.exec(started) ?? [];

  return {
    startProblems: problemsIn(started),
    printedAfter: async (change) => {
      const start = output.length;
      change();
      return printedUntil(CHANGE_HANDLED, start);
    },
    answers: async () => (await fetch(address)).ok,
  };
}

test('the preview reports each problem once, when it starts and after a change', {
  timeout: 60_000,
}, async (t) => {
  const dir = copySite(t, 'errors');
  const preview = await startPreview(t, dir);
  assert.deepEqual(sorted(preview.startProblems), sorted(expectedProblems(dir)));

  const page = path.join(dir, 'content/en/unknown-tag.md');
  const saved = await preview.printedAfter(() =>
    writeFileSync(page, `${readFileSync(page, 'utf-8')}\n{% box %}Text{% /box %}\n`),
  );
  const boxProblem = "content/en/unknown-tag.md:9  critical  Undefined tag: 'box'";
  assert.deepEqual(problemsIn(saved), [
    "content/en/unknown-tag.md:5  critical  Undefined tag: 'banner'",
    boxProblem,
  ]);

  const apiRegistry = path.join(dir, 'config/api.yaml');
  const failed = await preview.printedAfter(() =>
    writeFileSync(
      apiRegistry,
      `${readFileSync(apiRegistry, 'utf-8')}  - id: gone\n    spec: missing.yaml\n`,
    ),
  );
  const apiProblem = 'error  API reference build failed:';
  assert.deepEqual(
    sorted(problemsIn(failed)),
    sorted([...expectedProblems(dir), boxProblem, apiProblem]),
  );
  assert.ok(await preview.answers());
});

test('the preview lists an error once, without a stack, when a quick update fails', {
  timeout: 60_000,
}, async (t) => {
  const dir = copySite(t, 'errors');
  const preview = await startPreview(t, dir);

  // A saved site.json is reloaded by a quick update, which throws on invalid
  // JSON; the full run that follows stops at the same error, before the pages.
  const siteConfig = path.join(dir, 'config/site.json');
  const failed = await preview.printedAfter(() => writeFileSync(siteConfig, '{'));
  assert.deepEqual(problemsIn(failed), [`error  Failed to parse ${siteConfig}: Invalid JSON.`]);
  assert.doesNotMatch(failed, STACK_LINE);
  assert.ok(await preview.answers());
});
