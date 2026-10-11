import { InjectionToken } from '@angular/core';

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

/** Provisional composition types; replace with dlc-front's canonical contract. */
export type PortalRoute = string;

export interface ShellHttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

export interface ShellHttpResult<T = unknown> {
  readonly status: number;
  readonly body: T;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface ShellSessionSnapshot {
  readonly user: ShellUser | null;
}

export interface ShellContext {
  readonly http: { request<T>(request: ShellHttpRequest): Promise<ShellHttpResult<T>> };
  readonly session: {
    getSnapshot(): ShellSessionSnapshot;
    subscribe(listener: (snapshot: ShellSessionSnapshot) => void): () => void;
  };
  readonly navigation: { request(route: PortalRoute): Promise<void> | void };
  readonly route?: PortalRoute;
  readonly reportError?: (error: unknown) => void;
  readonly signal?: AbortSignal;
}

/** Angular DI bridge for the provisional shell-owned composition context. */
export const SHELL_CONTEXT = new InjectionToken<ShellContext>('SHELL_CONTEXT');

export interface PortalMountHandle {
  updateRoute(route: PortalRoute): Promise<void> | void;
  canLeave(): boolean | Promise<boolean>;
  unmount(): Promise<void> | void;
}
