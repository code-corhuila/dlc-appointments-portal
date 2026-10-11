import { access, readFile } from 'node:fs/promises';
import { SourceTextModule } from 'node:vm';

const output = new URL('../dist/site/portals/appointments/0.1.0-demo/', import.meta.url);
const entry = new URL('entry.js', output);
const stylesheet = new URL('entry.css', output);

await access(entry);
await access(stylesheet);

const source = await readFile(entry, 'utf8');
const module = new SourceTextModule(source, { identifier: entry.href });
await module.link(() => {
  throw new Error('Composition entry must not have external imports.');
});
await module.evaluate();

if (module.namespace.portalId !== 'appointments') throw new Error('Invalid portalId export.');
if (module.namespace.contractVersion !== 1) throw new Error('Invalid contractVersion export.');
if (typeof module.namespace.mount !== 'function') throw new Error('Missing mount export.');

if (source.includes('native-federation') || source.includes('es-module-shims')) {
  throw new Error('Composition entry must not require Native Federation.');
}

for (const match of source.matchAll(/(?:from|import\()\s*['"](\.\/[^'"]+)['"]/g)) {
  await access(new URL(match[1], entry));
}
