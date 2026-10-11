import { describe, expect, it } from 'vitest';

import {
  contractVersion,
  mount,
  portalId,
} from './entry';

describe('appointments composition entry', () => {
  it('exposes the provisional contract without changing the document on import', () => {
    expect(portalId).toBe('appointments');
    expect(contractVersion).toBe(1);
    expect(typeof mount).toBe('function');
    expect(document.body.innerHTML).toBe('');
  });

  it('mounts and removes only its own root idempotently', async () => {
    const host = document.createElement('div');
    const handle = await mount(host, context());

    expect(host.querySelector('apt-root')).not.toBeNull();
    expect(await handle.canLeave()).toBe(true);

    await handle.unmount();
    await handle.unmount();
    expect(host.children).toHaveLength(0);
  });

  it('does not mount when its signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const host = document.createElement('div');

    await expect(mount(host, context(controller.signal))).rejects.toThrow('aborted');
    expect(host.children).toHaveLength(0);
  });

  it('removes its root when the shell cancels after mounting', async () => {
    const controller = new AbortController();
    const host = document.createElement('div');
    const handle = await mount(host, context(controller.signal));

    await handle.updateRoute('/calendar');
    controller.abort();

    expect(host.children).toHaveLength(0);
    await handle.unmount();
  });

  function context(signal?: AbortSignal) {
    return { signal, http: { request: async () => ({ status: 200, body: {} }) }, session: { getSnapshot: () => ({ user: null }), subscribe: () => () => {} }, navigation: { request: () => {} } } as never;
  }
});
