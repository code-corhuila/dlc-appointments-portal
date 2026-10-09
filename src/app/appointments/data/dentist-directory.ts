
import { InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface DentistDirectoryItem {
  readonly id: string;
  readonly name: string;
}

export interface DentistDirectory {
  listDentists(): Observable<readonly DentistDirectoryItem[]>;
}

export const DENTIST_DIRECTORY =
  new InjectionToken<DentistDirectory>(
    'DENTIST_DIRECTORY',
    {
      providedIn: 'root',
      factory: () => ({
        // TODO(tech-debt): Replace this empty fallback with
        // the authorized IAM dentist directory integration.
        // Do not introduce mock dentists or an invented IAM endpoint.
        listDentists: () =>
          of([] as readonly DentistDirectoryItem[]),
      }),
    },
  );
