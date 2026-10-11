import { Injectable, signal } from '@angular/core';

import { PortalRoute } from './shell-contract';

@Injectable()
export class CompositionRouteState {
  readonly route = signal<PortalRoute>({ localPath: '' });

  update(route: PortalRoute): void {
    this.route.set(route);
  }
}
