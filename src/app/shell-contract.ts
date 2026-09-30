import { InjectionToken } from '@angular/core';

export type StaffRole =
  | 'ADMINISTRATOR'
  | 'SECRETARY_ASSISTANT'
  | 'DENTIST';

export interface ShellUser {
  readonly id: string;
  readonly roles: readonly StaffRole[];
}

export interface AppointmentsShellContext {
  readonly currentUser: ShellUser;
}

export const APPOINTMENTS_SHELL_CONTEXT =
  new InjectionToken<AppointmentsShellContext>(
    'APPOINTMENTS_SHELL_CONTEXT',
  );