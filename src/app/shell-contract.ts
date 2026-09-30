/**
 * Provisional compile-time boundary for dlc-front integration.
 *
 * TODO(open-question):
 * Replace this local shape with the canonical typed contract once
 * dlc-front publishes its integration boundary.
 *
 * Authentication, session state and HttpClient remain owned by dlc-front.
 */
export interface ShellUser {
  readonly id: string;
  readonly roles: readonly string[];
}

export interface AppointmentsShellContext {
  readonly currentUser: ShellUser;
}