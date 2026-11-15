import { InjectionToken } from '@angular/core';

/**
 * Composition contract v1 context passed by dlc-front to `mount(host, context)` (dlc-docs
 * `05-architecture/frontend-composition.md`, C02/C05/C06). The shell owns authentication, the session and
 * the transport: no token or credential ever reaches this portal.
 */
export interface PortalRoute {
  readonly localPath: string;
  readonly query?: Readonly<Record<string, readonly string[]>>;
}

export interface ShellNavigationRequest {
  readonly path: string;
  readonly replace?: boolean;
}

/** C06 request: a catalogued Gateway operation under /api/v1; the shell adds the Bearer token. */
export interface ShellHttpRequest {
  readonly method: string;
  readonly path: string;
  readonly query?: Readonly<Record<string, readonly string[]>>;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  readonly responseType?: 'json' | 'blob' | 'none';
  readonly signal?: AbortSignal;
}

export interface ShellHttpSuccess {
  readonly ok: true;
  readonly status: number;
  readonly data: unknown;
  readonly headers: Readonly<Record<string, string>>;
  readonly correlationId: string;
}

export interface ShellHttpFailure {
  readonly ok: false;
  readonly status: number;
  readonly error: string;
  readonly message: string;
  readonly details: unknown;
  readonly traceId: string;
  readonly correlationId: string;
  readonly kind: 'http' | 'network' | 'timeout' | 'cancelled' | 'contract' | 'session';
  readonly retryable: boolean;
}

export type ShellHttpResult = ShellHttpSuccess | ShellHttpFailure;

export interface ShellUser {
  readonly id: string;
  readonly name?: string;
  readonly roles: readonly string[];
}

/** C05 browser projection of the Auth-owned session. */
export interface ShellSessionSnapshot {
  readonly state?: 'resolving' | 'authenticated' | 'anonymous' | 'expired' | 'unavailable';
  readonly user: ShellUser | null;
  readonly permissions?: readonly string[];
}

export interface ShellContext {
  readonly contractVersion?: 1;
  readonly portalId?: string;
  readonly http: { request(request: ShellHttpRequest): Promise<ShellHttpResult> };
  readonly session: {
    getSnapshot(): ShellSessionSnapshot;
    subscribe(listener: (snapshot: ShellSessionSnapshot) => void): () => void;
  };
  readonly navigation: {
    request(request: ShellNavigationRequest): Promise<unknown> | void;
  };
  readonly route?: PortalRoute;
  /** C07 failure containment: codes and identifiers only. */
  readonly reportFailure?: (failure: unknown) => void;
  readonly signal?: AbortSignal;
}

/** Angular DI bridge for the shell-owned composition context. */
export const SHELL_CONTEXT = new InjectionToken<ShellContext>('SHELL_CONTEXT');

export interface PortalMountHandle {
  updateRoute(route: PortalRoute): Promise<void> | void;
  canLeave(): boolean | Promise<boolean>;
  unmount(): Promise<void> | void;
}
