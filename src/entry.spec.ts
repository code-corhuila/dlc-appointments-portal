import { describe, expect, it } from 'vitest';

import {
  CompositionMountNotImplementedError,
  contractVersion,
  mount,
  portalId,
} from './entry';

describe('appointments composition entry', () => {
  it('exposes the provisional contract without changing the document on import', () => {
    expect(portalId).toBe('appointments');
    expect(contractVersion).toBe(1);
    expect(typeof mount).toBe('function');
    expect(document.body.innerHTML).toBe('');
  });

  it('fails explicitly until the composition mount is implemented', async () => {
    await expect(mount(document.createElement('div'), {} as never))
      .rejects.toBeInstanceOf(CompositionMountNotImplementedError);
  });
});
