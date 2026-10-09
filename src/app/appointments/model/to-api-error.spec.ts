
import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { ApiError } from './api-error';
import { toApiError } from './to-api-error';

describe('toApiError', () => {
  const apiError: ApiError = {
    error: 'APPOINTMENT_CONFLICT',
    message: 'The selected slot is unavailable.',
    traceId: 'trace-123',
  };

  it('preserves an already normalized ApiError', () => {
    const result = toApiError(apiError);

    expect(result).toEqual(apiError);
  });

  it('extracts ApiError from HttpErrorResponse', () => {
    const httpError = new HttpErrorResponse({
      status: 409,
      error: apiError,
    });

    const result = toApiError(httpError);

    expect(result).toEqual(apiError);
  });

  it('preserves error details and traceId', () => {
    const errorWithDetails: ApiError = {
      error: 'STALE_VERSION',
      message: 'The availability version is outdated.',
      details: {
        expectedVersion: 3,
        currentVersion: 4,
      },
      traceId: 'trace-456',
    };

    const httpError = new HttpErrorResponse({
      status: 409,
      error: errorWithDetails,
    });

    const result = toApiError(httpError);

    expect(result).toEqual(errorWithDetails);
    expect(result.details).toEqual({
      expectedVersion: 3,
      currentVersion: 4,
    });
    expect(result.traceId).toBe('trace-456');
  });
});
