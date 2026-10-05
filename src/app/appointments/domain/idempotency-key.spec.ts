import { describe, expect, it } from 'vitest';

import { IdempotencyKeyManager } from './idempotency-key';

describe('IdempotencyKeyManager', () => {
  it('reuses the same key for retries of the same intent', () => {
    const keys = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ];

    const manager = new IdempotencyKeyManager(() => keys.shift()!);

    const first = manager.forIntent('appointment-v1');
    const retry = manager.forIntent('appointment-v1');

    expect(retry).toBe(first);
  });

  it('generates a new key when the intent changes', () => {
    const keys = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ];

    const manager = new IdempotencyKeyManager(() => keys.shift()!);

    const first = manager.forIntent('appointment-v1');
    const changed = manager.forIntent('appointment-v2');

    expect(changed).not.toBe(first);
    expect(changed).toBe('22222222-2222-4222-8222-222222222222');
  });
});