export type StaffRole =
  | 'ADMINISTRATOR'
  | 'SECRETARY_ASSISTANT'
  | 'DENTIST';

export interface ShellUser {
  readonly id: string;
  readonly roles: readonly StaffRole[];
}

/**
 * TODO(open-question):
 * Align this boundary with the final dlc-front shell contract.
 *
 * The portal must receive session context and Angular HttpClient
 * from the shell injector. It must never create or manage its own
 * authentication session or HTTP client.
 */
export interface AppointmentsShellContext {
  readonly currentUser: ShellUser;
}