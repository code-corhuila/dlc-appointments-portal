import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SHELL_CONTEXT, ShellContext } from '../../shell-contract';
import { fakeShellContext, shellFailure, shellOk } from '../../../testing/fake-shell';
import { ShellHttp } from './shell-http';

describe('ShellHttp', () => {
  function setup(context: ShellContext | null) {
    TestBed.configureTestingModule({
      providers: context ? [{ provide: SHELL_CONTEXT, useValue: context }] : [],
    });
    return TestBed.inject(ShellHttp);
  }

  it('sends the request through context.http and emits the response data', async () => {
    const { context, calls } = fakeShellContext(() => shellOk({ id: 'a-1' }));
    const http = setup(context);

    const data = await firstValueFrom(
      http.request<{ id: string }>({
        method: 'POST',
        path: '/api/v1/appointments',
        query: { page: ['2'] },
        body: { reason: 'Control' },
        headers: { 'Idempotency-Key': 'key-12345' },
      }),
    );

    expect(data).toEqual({ id: 'a-1' });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/appointments',
      query: { page: ['2'] },
      body: { reason: 'Control' },
      headers: { 'Idempotency-Key': 'key-12345' },
    });
    expect(calls[0].signal).toBeInstanceOf(AbortSignal);
  });

  it('maps a shell failure to the API error envelope', async () => {
    const { context } = fakeShellContext(() =>
      shellFailure(409, 'STALE_VERSION', { details: [{ field: 'version' }], traceId: 't-9' }),
    );
    const http = setup(context);

    await expect(
      firstValueFrom(http.request({ method: 'GET', path: '/api/v1/appointments' })),
    ).rejects.toEqual({
      error: 'STALE_VERSION',
      message: 'mensaje STALE_VERSION',
      details: [{ field: 'version' }],
      traceId: 't-9',
    });
  });

  it('aborts the shell request when the subscriber unsubscribes', () => {
    const { context, calls } = fakeShellContext(() => new Promise(() => undefined));
    const http = setup(context);

    const subscription = http.request({ method: 'GET', path: '/api/v1/appointments' }).subscribe();
    subscription.unsubscribe();

    expect(calls[0].signal?.aborted).toBe(true);
  });

  it('reports a cancelled mount as a cancelled request', async () => {
    const context = {
      http: { request: () => Promise.reject(new Error('CANCELLED')) },
    } as unknown as ShellContext;
    const http = setup(context);

    await expect(
      firstValueFrom(http.request({ method: 'GET', path: '/api/v1/appointments' })),
    ).rejects.toMatchObject({ error: 'CANCELLED' });
  });

  it('fails as unavailable outside the dlc-front composition', async () => {
    const http = setup(null);

    await expect(
      firstValueFrom(http.request({ method: 'GET', path: '/api/v1/appointments' })),
    ).rejects.toMatchObject({ error: 'SERVICE_UNAVAILABLE' });
  });

  it('turns query objects into repeated string values and drops empty ones', () => {
    expect(
      ShellHttp.query({ page: 1, limit: 20, search: 'ana', status: undefined, dentistId: null }),
    ).toEqual({ page: ['1'], limit: ['20'], search: ['ana'] });
  });
});
