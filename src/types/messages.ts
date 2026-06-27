import type { ShowcaseConfig, ShowcaseStop } from './showcase';

export type ContentInboundMessage =
  | { type: 'SHOWCASE_START'; config: ShowcaseConfig }
  | { type: 'SHOWCASE_STOP' }
  | { type: 'SHOWCASE_DETECT' }
  | { type: 'SHOWCASE_PING' };

export type ContentOutboundMessage =
  | { type: 'SHOWCASE_STATUS'; message: string }
  | { type: 'SHOWCASE_COMPLETE' }
  | { type: 'SHOWCASE_ERROR'; error: string }
  | { type: 'SHOWCASE_DETECT_RESULT'; stops: ShowcaseStop[]; truncated?: boolean }
  | { type: 'SHOWCASE_PONG' };

export type PopupInboundMessage =
  | { type: 'SHOWCASE_STATUS'; message: string }
  | { type: 'SHOWCASE_COMPLETE' }
  | { type: 'SHOWCASE_ERROR'; error: string }
  | { type: 'SHOWCASE_DETECT_RESULT'; stops: ShowcaseStop[]; truncated?: boolean };

export type BackgroundRequest =
  | { type: 'START_SHOWCASE'; tabId: number; hostname: string }
  | { type: 'STOP_SHOWCASE'; tabId: number }
  | { type: 'DETECT_SECTIONS'; tabId: number }
  | { type: 'GET_SITE_CONFIG'; hostname: string }
  | { type: 'SAVE_SITE_CONFIG'; hostname: string; config: import('./showcase').StoredSiteConfig }
  | { type: 'GET_ALL_HOSTNAMES' };

export type BackgroundResponse =
  | { ok: true; config?: ShowcaseConfig; hasSavedConfig?: boolean; hostnames?: string[] }
  | { ok: true; stops?: ShowcaseStop[]; truncated?: boolean }
  | { ok: false; error: string };
