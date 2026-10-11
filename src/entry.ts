import {
  PortalMountHandle,
  ShellContext,
} from './app/shell-contract';

export const portalId = 'appointments';
export const contractVersion = 1;

export class CompositionMountNotImplementedError extends Error {
  constructor() {
    super('Appointments composition mount is pending Increment 2.');
    this.name = 'CompositionMountNotImplementedError';
  }
}

/**
 * Deliberately resource-free until Angular createApplication mounting is added.
 * Importing this module must not bootstrap Angular or mutate the host document.
 */
export async function mount(
  _host: HTMLElement,
  _context: ShellContext,
): Promise<PortalMountHandle> {
  throw new CompositionMountNotImplementedError();
}
