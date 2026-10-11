import { access, cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';

const build = new URL('../dist/composition-entry/browser/', import.meta.url);
const output = new URL('../dist/site/portals/appointments/0.1.0-demo/', import.meta.url);

await access(build);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(build, output, { recursive: true });
await rename(new URL('main.js', output), new URL('entry.js', output));

try {
  await access(new URL('styles.css', output));
  await rename(new URL('styles.css', output), new URL('entry.css', output));
} catch {
  await writeFile(new URL('entry.css', output), '');
}
