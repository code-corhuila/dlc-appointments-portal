import { inject, InjectionToken } from '@angular/core';
import { EMPTY, expand, map, Observable, of, reduce } from 'rxjs';

import { Page } from '../model/page';
import { SHELL_CONTEXT } from '../../shell-contract';
import { ShellHttp } from './shell-http';

export interface DentistDirectoryItem {
  readonly id: string;
  readonly name: string;
}

export interface DentistDirectory {
  listDentists(): Observable<readonly DentistDirectoryItem[]>;
}

const PAGE_SIZE = 100;

/**
 * Dentists the user may schedule for: IAM `GET /api/v1/auth/dentists` (ACTIVE dentists, id and name) for
 * Administrator and Secretary/Assistant, and only the signed-in dentist for a Dentist.
 */
export const DENTIST_DIRECTORY = new InjectionToken<DentistDirectory>('DENTIST_DIRECTORY', {
  providedIn: 'root',
  factory: () => {
    const http = inject(ShellHttp);
    const context = inject(SHELL_CONTEXT, { optional: true });
    const read = (page: number) =>
      http.request<Page<DentistDirectoryItem>>({
        method: 'GET',
        path: '/api/v1/auth/dentists',
        query: ShellHttp.query({ page, limit: PAGE_SIZE }),
      });
    return {
      listDentists: () => {
        const user = context?.session.getSnapshot().user;
        if (user?.roles.includes('DENTIST') && user.roles.length === 1) {
          return of([{ id: user.id, name: user.name ?? '' }]);
        }
        return read(1).pipe(
          expand((page) => (page.meta.page < page.meta.totalPages ? read(page.meta.page + 1) : EMPTY)),
          map((page) => page.data.map(({ id, name }) => ({ id, name }))),
          reduce((all, items) => [...all, ...items], [] as DentistDirectoryItem[]),
        );
      },
    };
  },
});
