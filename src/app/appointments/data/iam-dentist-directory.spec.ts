import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SHELL_CONTEXT, ShellContext, ShellHttpRequest } from '../../shell-contract';
import { shellFailure, shellOk } from '../../../testing/fake-shell';
import { DENTIST_DIRECTORY } from './dentist-directory';

describe('IAM dentist directory', () => {
  function setup(roles: readonly string[], respond: (request: ShellHttpRequest) => unknown) {
    const calls: ShellHttpRequest[] = [];
    const context = {
      http: {
        request: async (request: ShellHttpRequest) => {
          calls.push(request);
          return respond(request);
        },
      },
      session: {
        getSnapshot: () => ({ user: { id: 'staff-9', name: 'Dra. Propia', roles } }),
        subscribe: () => () => undefined,
      },
    } as unknown as ShellContext;
    TestBed.configureTestingModule({ providers: [{ provide: SHELL_CONTEXT, useValue: context }] });
    return { directory: TestBed.inject(DENTIST_DIRECTORY), calls };
  }

  it('reads every page of GET /api/v1/auth/dentists for scheduling staff', async () => {
    const { directory, calls } = setup(['SECRETARY_ASSISTANT'], (request) =>
      request.query?.['page']?.[0] === '1'
        ? shellOk({ data: [{ id: 'd-1', name: 'Dra. Ruiz' }], meta: { page: 1, limit: 100, total: 2, totalPages: 2 } })
        : shellOk({ data: [{ id: 'd-2', name: 'Dr. Mora' }], meta: { page: 2, limit: 100, total: 2, totalPages: 2 } }),
    );

    const dentists = await firstValueFrom(directory.listDentists());

    expect(dentists).toEqual([
      { id: 'd-1', name: 'Dra. Ruiz' },
      { id: 'd-2', name: 'Dr. Mora' },
    ]);
    expect(calls.map((call) => [call.method, call.path, call.query])).toEqual([
      ['GET', '/api/v1/auth/dentists', { page: ['1'], limit: ['100'] }],
      ['GET', '/api/v1/auth/dentists', { page: ['2'], limit: ['100'] }],
    ]);
  });

  it('gives a dentist only their own entry from the session, without calling IAM', async () => {
    const { directory, calls } = setup(['DENTIST'], () => shellOk({}));

    await expect(firstValueFrom(directory.listDentists())).resolves.toEqual([
      { id: 'staff-9', name: 'Dra. Propia' },
    ]);
    expect(calls).toHaveLength(0);
  });

  it('propagates the IAM error instead of inventing dentists', async () => {
    const { directory } = setup(['ADMINISTRATOR'], () => shellFailure(403, 'FORBIDDEN'));

    await expect(firstValueFrom(directory.listDentists())).rejects.toMatchObject({ error: 'FORBIDDEN' });
  });
});
