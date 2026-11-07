import { readFile } from 'node:fs/promises';

/** The published release is the package version: /portals/appointments/{release}/entry.js (C01). */
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
export const release = pkg.version;
export const entryDirectory = new URL(`../dist/site/portals/appointments/${release}/`, import.meta.url);
