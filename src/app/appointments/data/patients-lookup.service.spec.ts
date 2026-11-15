import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SHELL_CONTEXT, ShellHttpRequest } from '../../shell-contract';
import { fakeShellContext, shellOk } from '../../../testing/fake-shell';
import { PatientsLookupService } from './patients-lookup.service';

describe('PatientsLookupService', () => {
  let service: PatientsLookupService;
  let calls: ShellHttpRequest[];

  beforeEach(() => {
    const shell = fakeShellContext(() =>
      shellOk({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
    );
    calls = shell.calls;
    TestBed.configureTestingModule({
      providers: [{ provide: SHELL_CONTEXT, useValue: shell.context }],
    });
    service = TestBed.inject(PatientsLookupService);
  });

  it('searches patients through the shell with the Patients query parameters', async () => {
    await firstValueFrom(
      service.searchPatients({ page: 1, limit: 20, search: 'Daniel', status: 'ACTIVE' }),
    );

    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/api/v1/patients',
      query: { page: ['1'], limit: ['20'], search: ['Daniel'], status: ['ACTIVE'] },
    });
  });

  it('omits filters that were not given', async () => {
    await firstValueFrom(service.searchPatients());

    expect(calls[0].query).toEqual({});
  });

  it('reads a patient by id using the published Patients route', async () => {
    await firstValueFrom(service.getPatient('p/1'));

    expect(calls[0]).toMatchObject({ method: 'GET', path: '/api/v1/patients/p%2F1' });
  });
});
