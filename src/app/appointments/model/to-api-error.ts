
import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from './api-error';

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string' &&
    'message' in value &&
    typeof value.message === 'string' &&
    'traceId' in value &&
    typeof value.traceId === 'string'
  );
}

export function toApiError(error: unknown): ApiError {
  const body =
    error instanceof HttpErrorResponse
      ? error.error
      : error;

  if (isApiError(body)) {
    return body;
  }

  return {
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
    traceId: '',
  };
}
