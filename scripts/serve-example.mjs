import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = new Map([
  ['/', ['examples/todos/index.html', 'text/html']],
  ['/app.js', ['examples/todos/app.js', 'text/javascript']],
  ['/style.css', ['examples/todos/style.css', 'text/css']],
  ['/vendor/jquery.js', ['node_modules/jquery/dist/jquery.js', 'text/javascript']],
  ['/vendor/underscore.js', ['node_modules/underscore/underscore-umd.js', 'text/javascript']],
  ['/vendor/backbone.js', ['node_modules/backbone/backbone.js', 'text/javascript']],
  ['/andamio.js', ['lib/andamio.js', 'text/javascript']]
]);
export function createExampleServer() {
  return createServer(async (req, res) => {
    const file = files.get(new URL(req.url, 'http://localhost').pathname);
    if (!file || !['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(404).end('Not found');
      return;
    }
    try {
      const body = await readFile(resolve(root, file[0]));
      res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(500).end('Run npm install and npm run build first.');
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer from 0 to 65535.');
  }
  const server = createExampleServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Sample app: http://127.0.0.1:${server.address().port}`);
  });
}
