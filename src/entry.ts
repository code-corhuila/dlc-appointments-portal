import {
  PortalMountHandle,
  PortalRoute,
  SHELL_CONTEXT,
  ShellContext,
} from './app/shell-contract';
import { provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';

import { AppointmentsRootComponent } from './app/appointments-root.component';
import { CompositionNavigationService } from './app/composition-navigation.service';
import { CompositionRouteState } from './app/composition-route-state';

export const portalId = 'appointments';
export const contractVersion = 1;

export async function mount(
  host: HTMLElement,
  context: ShellContext,
): Promise<PortalMountHandle> {
  if (context.signal?.aborted) throw new Error('Composition mount aborted.');

  let root: HTMLElement | undefined;
  let app: Awaited<ReturnType<typeof createApplication>> | undefined;
  let route: PortalRoute = context.route ?? { localPath: '' };
  let disposed = false;

  const unmount = (): void => {
    if (disposed) return;
    disposed = true;
    context.signal?.removeEventListener('abort', abort);
    try { app?.destroy(); } finally { root?.remove(); }
  };
  const abort = (): void => unmount();

  context.signal?.addEventListener('abort', abort, { once: true });

  try {
    app = await createApplication({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SHELL_CONTEXT, useValue: context },
        CompositionNavigationService,
        CompositionRouteState,
      ],
    });
    if (disposed || context.signal?.aborted) {
      app.destroy();
      throw new Error('Composition mount aborted.');
    }
    root = document.createElement('apt-root');
    host.append(root);
    app.injector.get(CompositionRouteState).update(route);
    app.bootstrap(AppointmentsRootComponent, root);
  } catch (error) {
    unmount();
    if (!context.signal?.aborted) context.reportFailure?.(error);
    throw error;
  }

  return {
    updateRoute: (next) => {
      if (disposed) return;
      route = next;
      app?.injector.get(CompositionRouteState).update(route);
      app?.tick();
    },
    canLeave: () => true,
    unmount,
  };
}
