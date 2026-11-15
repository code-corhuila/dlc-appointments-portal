import { InjectionToken } from '@angular/core';

/** Current time source; replaced in tests so dates do not depend on the machine clock. */
export const CLINIC_CLOCK = new InjectionToken<() => Date>('CLINIC_CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
