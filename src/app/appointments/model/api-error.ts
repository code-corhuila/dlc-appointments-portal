export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'APPOINTMENT_CONFLICT'
  | 'STALE_VERSION'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INVALID_STATUS_TRANSITION'
  | 'BUSINESS_RULE_VIOLATION'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  // dlc-front transport outcomes (C06) that never reach the owner service.
  | 'SESSION_UNAVAILABLE'
  | 'INVALID_REQUEST'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED';

export interface ApiError {
  readonly error: ApiErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly traceId: string;
}