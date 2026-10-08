import { readFile, writeFile } from 'node:fs/promises';
import { minify } from 'terser';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const core = await readFile(new URL('src/andamio.core.js', root), 'utf8');
const sources = {};
for (const match of core.matchAll(/\/\/ @include ([\w.]+\.js)/g)) {
  sources[match[1]] = await readFile(new URL(`src/${match[1]}`, root), 'utf8');
}
const banner = `/*! ${pkg.name} v${pkg.version} | ${pkg.homepage} | MIT */\n`;
const code = banner + core.replace(/\/\/ @include ([\w.]+\.js)/g, (_, name) => sources[name].trim());
const output = await minify({ 'andamio.js': code }, {
  format: { comments: /^!/ },
  sourceMap: { filename: 'andamio.min.js', url: 'andamio.map', includeSources: true }
});
await writeFile(new URL('lib/andamio.js', root), code);
await writeFile(new URL('lib/andamio.min.js', root), output.code + '\n');
await writeFile(new URL('lib/andamio.map', root), output.map + '\n');
