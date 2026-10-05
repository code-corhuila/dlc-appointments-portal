export type IdempotencyKeyGenerator = () => string;

export class IdempotencyKeyManager {
  private currentIntent?: string;
  private currentKey?: string;

  constructor(
    private readonly generateKey: IdempotencyKeyGenerator = () =>
      crypto.randomUUID(),
  ) {}

  forIntent(intent: string): string {
    if (this.currentIntent !== intent || !this.currentKey) {
      this.currentIntent = intent;
      this.currentKey = this.generateKey();
    }

    return this.currentKey;
  }
}