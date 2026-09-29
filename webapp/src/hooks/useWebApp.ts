import { useMemo } from 'react';
import type { MaxPlatform } from '../types/webapp';

export interface WebAppInfo {
  /** True when running inside MAX (real Bridge present). */
  isMax: boolean;
  platform: MaxPlatform | string;
  initData: string;
  version: string;
}

// Dev fallback so `npm run dev` works in a plain browser outside MAX.
const DEV_MOCK: WebAppInfo = {
  isMax: false,
  platform: 'web',
  initData: '',
  version: 'dev-mock',
};

/**
 * Read MAX Bridge state (window.WebApp).
 * Returns a mock outside MAX so local development keeps working.
 * Docs: https://dev.max.ru/docs/webapps/bridge
 */
export function useWebApp(): WebAppInfo {
  return useMemo(() => {
    const bridge = typeof window !== 'undefined' ? window.WebApp : undefined;
    if (!bridge) return DEV_MOCK;
    return {
      isMax: true,
      platform: (bridge.platform as MaxPlatform) ?? 'web',
      initData: bridge.initData ?? '',
      version: bridge.version ?? 'unknown',
    };
  }, []);
}
