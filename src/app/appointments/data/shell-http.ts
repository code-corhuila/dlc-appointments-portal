import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiError } from '../model/api-error';
import { SHELL_CONTEXT, ShellHttpFailure, ShellHttpRequest } from '../../shell-contract';

const OUTSIDE_SHELL: ApiError = {
  error: 'SERVICE_UNAVAILABLE',
  message: 'El servicio de citas solo está disponible dentro de la aplicación.',
  traceId: '',
};

const CANCELLED: ApiError = {
  error: 'CANCELLED',
  message: 'La solicitud fue cancelada.',
  traceId: '',
};

/**
 * The only transport of this portal: dlc-front `context.http` (C06). The shell attaches the session token,
 * checks the operation catalogue and cancels requests when the portal unmounts; unsubscribing aborts too.
 */
@Injectable({ providedIn: 'root' })
export class ShellHttp {
  private readonly context = inject(SHELL_CONTEXT, { optional: true });

  /** Query values as the shell expects them; undefined and null filters are left out. */
  static query(values: object): Record<string, string[]> {
    const query: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) query[key] = [String(value)];
    }
    return query;
  }

  request<T>(input: Omit<ShellHttpRequest, 'signal'>): Observable<T> {
    return new Observable<T>((subscriber) => {
      const http = this.context?.http;
      if (!http) {
        subscriber.error(OUTSIDE_SHELL);
        return undefined;
      }
      const controller = new AbortController();
      http.request({ ...input, signal: controller.signal }).then(
        (result) => {
          if (result.ok) {
            subscriber.next(result.data as T);
            subscriber.complete();
          } else {
            subscriber.error(toApiError(result));
          }
        },
        () => subscriber.error(CANCELLED),
      );
      return () => controller.abort();
    });
  }
}

function toApiError(failure: ShellHttpFailure): ApiError {
  return {
    error: failure.error as ApiError['error'],
    message: failure.message,
    details: failure.details,
    traceId: failure.traceId,
  };
}
