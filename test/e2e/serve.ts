/*
 * Serves a built Mordoc site the way a static host does, so the browser
 * tests check the site as it is published. Mordoc writes each page to its
 * own `index.html` (`/guide/callouts` → `guide/callouts/index.html`), which
 * a static host serves for the address with or without a trailing slash.
 * `vite preview` serves the home page for an address without one, so it
 * can't be used here.
 *
 * Usage: node test/e2e/serve.ts <dist folder> <port>
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.wasm': 'application/wasm',
};

const [distArg, portArg] = process.argv.slice(2);
if (!distArg || !portArg) {
  console.error('Usage: node test/e2e/serve.ts <dist folder> <port>');
  process.exit(1);
}
const root = path.resolve(distArg);

function isFile(filePath: string): boolean {
  return statSync(filePath, { throwIfNoEntry: false })?.isFile() ?? false;
}

/** Decodes a URL path, or returns null when it is malformed, such as `/%E0%A4%A`. */
function decodePath(urlPath: string): string | null {
  try {
    return decodeURIComponent(urlPath);
  } catch {
    return null;
  }
}

/** The file a static host serves for a URL path, or null when there is none. */
function fileFor(urlPath: string): string | null {
  const decoded = decodePath(urlPath);
  if (decoded === null) return null;
  const filePath = path.join(root, decoded);
  // A path such as `/../secret` must not leave the site's folder.
  if (filePath !== root && !filePath.startsWith(root + path.sep)) return null;
  if (isFile(filePath)) return filePath;
  const pageIndex = path.join(filePath, 'index.html');
  return isFile(pageIndex) ? pageIndex : null;
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const filePath = fileFor(pathname);
  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(response);
}).listen(Number(portArg), () => {
  console.log(`Serving ${root} at http://localhost:${portArg}`);
});
