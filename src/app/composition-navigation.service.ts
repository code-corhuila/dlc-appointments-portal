import { Injectable, inject } from '@angular/core';

import { PortalRoute, SHELL_CONTEXT } from './shell-contract';

@Injectable()
export class CompositionNavigationService {
  private readonly context = inject(SHELL_CONTEXT);

  request(route: PortalRoute): Promise<unknown> | void {
    return this.context.navigation.request({
      path: this.toShellPath(route),
    });
  }

  /** C04 navigation to another portal's shell-absolute path (e.g. Patients). */
  requestShellPath(path: string): Promise<unknown> | void {
    return this.context.navigation.request({ path });
  }

  private toShellPath(route: PortalRoute): string {
    const query = new URLSearchParams();
    for (const [name, values] of Object.entries(route.query ?? {})) {
      for (const value of values) query.append(name, value);
    }
    const serializedQuery = query.toString();
    return `/app/appointments${route.localPath}${serializedQuery ? `?${serializedQuery}` : ''}`;
  }
}
