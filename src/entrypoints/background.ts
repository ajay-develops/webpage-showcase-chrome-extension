import {
  buildShowcaseConfigForHostname,
  getAllHostnames,
  getFullStorageSchema,
  importStorageSchema,
  saveStoredSiteConfig,
} from '../storage';
import type {
  BackgroundRequest,
  BackgroundResponse,
  ContentInboundMessage,
  ContentOutboundMessage,
} from '../types/messages';
import type { ShowcaseConfig, StoredSiteConfig } from '../types/showcase';
import { DEFAULT_CONFIG } from '../defaults';

async function pingContentScript(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SHOWCASE_PING',
    } satisfies ContentInboundMessage);
    return response?.type === 'SHOWCASE_PONG';
  } catch {
    return false;
  }
}

async function ensureContentScript(tabId: number): Promise<void> {
  const alive = await pingContentScript(tabId);
  if (alive) return;

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-scripts/content.js'],
  });
}

async function sendToContent<T>(
  tabId: number,
  message: ContentInboundMessage,
): Promise<T> {
  await ensureContentScript(tabId);
  return chrome.tabs.sendMessage(tabId, message) as Promise<T>;
}

async function handleStartShowcase(
  tabId: number,
  hostname: string,
): Promise<BackgroundResponse> {
  const { config, hasSavedConfig } =
    await buildShowcaseConfigForHostname(hostname);

  let finalConfig: ShowcaseConfig = config;

  if (!hasSavedConfig || !config.stops.length) {
    const detectResult = await sendToContent<ContentOutboundMessage>(tabId, {
      type: 'SHOWCASE_DETECT',
    });

    if (detectResult.type !== 'SHOWCASE_DETECT_RESULT') {
      return { ok: false, error: 'Section detection failed' };
    }

    if (!detectResult.stops.length) {
      return { ok: false, error: 'No sections detected on this page' };
    }

    finalConfig = {
      ...config,
      stops: detectResult.stops,
    };

    await saveStoredSiteConfig(hostname, {
      stops: detectResult.stops,
      updatedAt: new Date().toISOString(),
    });
  }

  await sendToContent(tabId, {
    type: 'SHOWCASE_START',
    config: finalConfig,
  });

  return { ok: true, config: finalConfig, hasSavedConfig };
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (
      message: BackgroundRequest,
      _sender,
      sendResponse: (response: BackgroundResponse) => void,
    ) => {
      const handle = async () => {
        try {
          if (message.type === 'GET_SITE_CONFIG') {
            const result = await buildShowcaseConfigForHostname(message.hostname);
            return {
              ok: true as const,
              config: result.config,
              hasSavedConfig: result.hasSavedConfig,
            };
          }

          if (message.type === 'GET_ALL_HOSTNAMES') {
            const hostnames = await getAllHostnames();
            return { ok: true as const, hostnames };
          }

          if (message.type === 'SAVE_SITE_CONFIG') {
            await saveStoredSiteConfig(message.hostname, message.config);
            return { ok: true as const };
          }

          if (message.type === 'DETECT_SECTIONS') {
            const detectResult = await sendToContent<ContentOutboundMessage>(
              message.tabId,
              { type: 'SHOWCASE_DETECT' },
            );

            if (detectResult.type !== 'SHOWCASE_DETECT_RESULT') {
              return { ok: false, error: 'Section detection failed' };
            }

            return {
              ok: true,
              stops: detectResult.stops,
              truncated: detectResult.truncated,
            };
          }

          if (message.type === 'STOP_SHOWCASE') {
            await sendToContent(message.tabId, { type: 'SHOWCASE_STOP' });
            return { ok: true as const };
          }

          if (message.type === 'START_SHOWCASE') {
            return handleStartShowcase(message.tabId, message.hostname);
          }

          return { ok: false, error: 'Unknown message type' };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          return { ok: false, error: errorMessage };
        }
      };

      void handle().then(sendResponse);
      return true;
    },
  );

  chrome.runtime.onMessage.addListener((message: ContentOutboundMessage) => {
    if (
      message.type === 'SHOWCASE_STATUS' ||
      message.type === 'SHOWCASE_COMPLETE' ||
      message.type === 'SHOWCASE_ERROR'
    ) {
      void chrome.runtime.sendMessage(message).catch(() => {
        // No listeners when popup is closed.
      });
    }
  });
});
