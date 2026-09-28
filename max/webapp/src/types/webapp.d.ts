// Minimal typings for MAX Bridge (https://dev.max.ru/docs/webapps/bridge).
// The real object is injected by https://st.max.ru/js/max-web-app.js as window.WebApp.
export type MaxPlatform = 'ios' | 'android' | 'desktop' | 'web';

export interface MaxWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface MaxWebAppInitDataUnsafe {
  query_id?: string;
  auth_date?: number;
  hash?: string;
  user?: MaxWebAppUser;
  chat?: { id: number; type: 'DIALOG' | 'CHAT' | 'CHANNEL' };
  start_param?: string;
}

export interface MaxWebApp {
  initData: string;
  initDataUnsafe: MaxWebAppInitDataUnsafe;
  platform: MaxPlatform | string;
  version: string;
  deviceName?: string;
}

declare global {
  interface Window {
    WebApp?: MaxWebApp;
  }
}

export {};
