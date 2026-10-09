
import { InjectionToken } from '@angular/core';

import { CLINIC_TIME_ZONE } from '../domain/clinic-time';

/**
 * Provides the clinic time zone to appointment components.
 *
 * Defaults to America/Bogota until the host application
 * supplies an authorized clinic configuration.
 *
 * TODO(tech-debt): Confirm the canonical clinic configuration
 * contract when dlc-front integration becomes available.
 */
export const CLINIC_TIME_ZONE_CONFIG =
  new InjectionToken<string>(
    'CLINIC_TIME_ZONE_CONFIG',
    {
      providedIn: 'root',
      factory: () => CLINIC_TIME_ZONE,
    },
  );
