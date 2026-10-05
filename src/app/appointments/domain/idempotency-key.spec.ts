import { describe, expect, it } from 'vitest';

import { CreateAppointmentRequest } from '../model/appointment';
import { IdempotencyKeyManager } from './idempotency-key';

const appointmentRequest: CreateAppointmentRequest = {
  patientId: '11111111-1111-4111-8111-111111111111',
  dentistId: '22222222-2222-4222-8222-222222222222',
  startAt: '2026-10-06T09:00:00-05:00',
  endAt: '2026-10-06T10:00:00-05:00',
  reason: 'Routine appointment',
};

describe('IdempotencyKeyManager', () => {
  it('reuses the same key for equivalent appointment payloads', () => {
    const keys = [
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ];

    const manager = new IdempotencyKeyManager(() => keys.shift()!);

    const first = manager.forIntent(appointmentRequest);
    const retry = manager.forIntent({ ...appointmentRequest });

    expect(retry).toBe(first);
  });

  it('generates a new key when the appointment reason changes', () => {
    const keys = [
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ];

    const manager = new IdempotencyKeyManager(() => keys.shift()!);

    const first = manager.forIntent(appointmentRequest);
    const changed = manager.forIntent({
      ...appointmentRequest,
      reason: 'Updated appointment reason',
    });

    expect(changed).not.toBe(first);
  });

  it('generates a new key when the appointment time changes', () => {
    const keys = [
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ];

    const manager = new IdempotencyKeyManager(() => keys.shift()!);

    const first = manager.forIntent(appointmentRequest);
    const changed = manager.forIntent({
      ...appointmentRequest,
      startAt: '2026-10-06T10:00:00-05:00',
      endAt: '2026-10-06T11:00:00-05:00',
    });

    expect(changed).not.toBe(first);
  });

  it('generates a new key when the user returns to previously used content', () => {
    const keys = [
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    ];

    const manager = new IdempotencyKeyManager(() => keys.shift()!);

    const first = manager.forIntent(appointmentRequest);

    manager.forIntent({
      ...appointmentRequest,
      reason: 'Another booking intent',
    });

    const returnedToOriginal = manager.forIntent({
      ...appointmentRequest,
    });

    expect(returnedToOriginal).not.toBe(first);
    expect(returnedToOriginal).toBe(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    );
  });
});