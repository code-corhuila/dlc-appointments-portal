import type { CreateAppointmentRequest } from '../model/appointment';

export type IdempotencyKeyGenerator = () => string;

export class IdempotencyKeyManager {
  private currentIntent?: string;
  private currentKey?: string;

  constructor(
    private readonly generateKey: IdempotencyKeyGenerator = () =>
      crypto.randomUUID(),
  ) {}

  forIntent(request: CreateAppointmentRequest): string {
    const intent = this.createIntentFingerprint(request);

    if (this.currentIntent === intent && this.currentKey) {
      return this.currentKey;
    }

    const newKey = this.generateKey();

    this.currentIntent = intent;
    this.currentKey = newKey;

    return newKey;
  }

  private createIntentFingerprint(
    request: CreateAppointmentRequest,
  ): string {
    const canonicalEntries = Object.entries(request).sort(
      ([left], [right]) => left.localeCompare(right),
    );

    return JSON.stringify(Object.fromEntries(canonicalEntries));
  }
}