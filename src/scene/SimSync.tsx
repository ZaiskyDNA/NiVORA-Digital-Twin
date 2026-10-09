/** Memasang sinkronisasi store → simFrame selama scene ter-mount. */
import { useEffect } from 'react';
import { syncSimFrame } from './simFrame';

export function SimSync() {
  useEffect(() => syncSimFrame(), []);
  return null;
}
