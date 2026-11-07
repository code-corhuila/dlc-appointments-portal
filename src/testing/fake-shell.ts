import {
  ShellContext,
  ShellHttpRequest,
  ShellHttpResult,
} from '../app/shell-contract';

/** Test double of the dlc-front context.http capability (C06); records every request. */
export function fakeShellContext(
  respond: (request: ShellHttpRequest) => ShellHttpResult | Promise<ShellHttpResult> = () =>
    shellOk({}),
) {
  const calls: ShellHttpRequest[] = [];
  const context = {
    http: {
      request: async (request: ShellHttpRequest) => {
        calls.push(request);
        return respond(request);
      },
    },
  } as unknown as ShellContext;
  return { context, calls };
}

export const shellOk = (data: unknown, status = 200): ShellHttpResult => ({
  ok: true,
  status,
  data,
  headers: {},
  correlationId: 'corr-1',
});

export const shellFailure = (
  status: number,
  error: string,
  extra: Partial<{ details: unknown; traceId: string; kind: string }> = {},
): ShellHttpResult =>
  ({
    ok: false,
    status,
    error,
    message: `mensaje ${error}`,
    details: extra.details ?? null,
    traceId: extra.traceId ?? 'trace-1',
    correlationId: 'corr-1',
    kind: extra.kind ?? 'http',
    retryable: false,
  }) as ShellHttpResult;
