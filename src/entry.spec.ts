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
    const handle = await mount(host, context({ localPath: '/calendar' }));

    expect(host.querySelector('app-calendar-page')).not.toBeNull();
    expect(await handle.canLeave()).toBe(true);

    await handle.unmount();
    await handle.unmount();
    expect(host.children).toHaveLength(0);
  });

  it('does not mount when its signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const host = document.createElement('div');

    await expect(mount(host, context({ localPath: '/calendar' }, controller.signal))).rejects.toThrow('aborted');
    expect(host.children).toHaveLength(0);
  });

  it('removes its root when the shell cancels after mounting', async () => {
    const controller = new AbortController();
    const host = document.createElement('div');
    const handle = await mount(host, context({ localPath: '/calendar' }, controller.signal));

    await handle.updateRoute({ localPath: '/calendar' });
    controller.abort();

    expect(host.children).toHaveLength(0);
    await handle.unmount();
  });

  it.each([
    ['/new', 'app-scheduling-page'],
    ['/availability', 'app-availability-page'],
    ['/my-calendar', 'app-dentist-own-calendar'],
    ['/clinical-assignments', 'app-clinical-assignments-page'],
    ['/forbidden', 'app-forbidden-page'],
    ['/unknown', 'app-not-found-page'],
    ['', 'app-not-found-page'],
  ])('renders %s using its existing page component', async (localPath, selector) => {
    const host = document.createElement('div');
    const handle = await mount(host, context({ localPath }));

    expect(host.querySelector(selector)).not.toBeNull();
    await handle.unmount();
  });

  it('changes the rendered page without changing the browser URL', async () => {
    const host = document.createElement('div');
    const originalPath = window.location.href;
    const handle = await mount(host, context({ localPath: '/calendar' }));

    await handle.updateRoute({ localPath: '/new' });
    await handle.updateRoute({ localPath: '/forbidden' });

    expect(host.querySelector('app-forbidden-page')).not.toBeNull();
    expect(window.location.href).toBe(originalPath);
    await handle.unmount();
  });

  it('keeps route updates isolated to the mounted portal instance', async () => {
    const firstHost = document.createElement('div');
    const secondHost = document.createElement('div');
    const first = await mount(firstHost, context({ localPath: '/calendar' }));
    const second = await mount(secondHost, context({ localPath: '/new' }));

    await first.updateRoute({ localPath: '/forbidden' });

    expect(firstHost.querySelector('app-forbidden-page')).not.toBeNull();
    expect(secondHost.querySelector('app-scheduling-page')).not.toBeNull();
    await first.unmount();
    await second.unmount();
  });

  function context(route: { localPath: string }, signal?: AbortSignal) {
    return { route, signal, http: { request: async () => ({ status: 200, body: {} }) }, session: { getSnapshot: () => ({ user: null }), subscribe: () => () => {} }, navigation: { request: () => {} } } as never;
  }
});
