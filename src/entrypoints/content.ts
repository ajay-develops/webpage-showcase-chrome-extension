import { sleep, runShowcaseTour } from '../content/showcase-engine';
import { autoDetectSections } from '../content/section-discovery';
import {
  createOverlay,
  hasScrollBlockingOverflow,
  hideTourMode,
  registerEscListener,
  removeOverlay,
  runCountdown,
  setOverlayText,
  showTourMode,
} from '../content/showcase-ui';
import type { ContentInboundMessage, ContentOutboundMessage } from '../types/messages';
import type { ShowcaseConfig, ShowcaseTourHandle } from '../types/showcase';

export default defineContentScript({
  registration: 'runtime',
  runAt: 'document_idle',
  main() {
    let tourHandle: ShowcaseTourHandle | null = null;
    let removeEscListener: (() => void) | null = null;
    let spaAbortHandlers: Array<() => void> | null = null;
    let running = false;
    let tourAbortController: AbortController | null = null;

    function abortActiveTour(): void {
      tourAbortController?.abort();
      tourHandle?.abort();
    }

    function sendMessage(message: ContentOutboundMessage): void {
      void chrome.runtime.sendMessage(message).catch(() => {
        // Popup may be closed.
      });
    }

    function cleanupTourUi(): void {
      removeEscListener?.();
      removeEscListener = null;
      spaAbortHandlers?.forEach((off) => off());
      spaAbortHandlers = null;
      hideTourMode();
      removeOverlay();
      tourHandle = null;
      tourAbortController = null;
      running = false;
    }

    function registerSpaAbort(onAbort: () => void): void {
      const handler = () => onAbort();
      window.addEventListener('popstate', handler);
      window.addEventListener('hashchange', handler);

      spaAbortHandlers = [
        () => window.removeEventListener('popstate', handler),
        () => window.removeEventListener('hashchange', handler),
      ];
    }

    async function startTour(config: ShowcaseConfig): Promise<void> {
      if (running) return;
      running = true;

      createOverlay('Preparing tour…');
      showTourMode();

      if (hasScrollBlockingOverflow()) {
        setOverlayText('Warning: page may not scroll (overflow hidden)');
        sendMessage({
          type: 'SHOWCASE_STATUS',
          message: 'Warning: page may not scroll (overflow hidden)',
        });
      }

      tourAbortController = new AbortController();
      const { signal } = tourAbortController;
      let aborted = false;

      removeEscListener = registerEscListener(() => {
        aborted = true;
        abortActiveTour();
        setOverlayText('Tour stopped');
        sendMessage({ type: 'SHOWCASE_STATUS', message: 'Tour stopped' });
      });

      registerSpaAbort(() => {
        aborted = true;
        abortActiveTour();
        setOverlayText('Tour stopped (navigation detected)');
        sendMessage({
          type: 'SHOWCASE_ERROR',
          error: 'Tour aborted due to page navigation',
        });
        cleanupTourUi();
      });

      try {
        if (hasScrollBlockingOverflow()) {
          await sleep(1500, signal);
        }

        await sleep(config.introDelayMs, signal);

        if (config.countdownSeconds > 0) {
          await runCountdown(
            config.countdownSeconds,
            (remaining) => setOverlayText(`Starting in ${remaining}…`),
            signal,
          );
        }

        setOverlayText('Recording tour… Esc to stop');

        tourHandle = runShowcaseTour(config, (message) => {
          setOverlayText(message);
          sendMessage({ type: 'SHOWCASE_STATUS', message });
        });

        await tourHandle.done;

        if (!aborted) {
          sendMessage({ type: 'SHOWCASE_COMPLETE' });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (!aborted) {
            setOverlayText('Tour stopped');
            sendMessage({ type: 'SHOWCASE_STATUS', message: 'Tour stopped' });
          }
        } else {
          const message =
            error instanceof Error ? error.message : 'Unknown tour error';
          setOverlayText(`Error: ${message}`);
          sendMessage({ type: 'SHOWCASE_ERROR', error: message });
        }
      } finally {
        cleanupTourUi();
      }
    }

    chrome.runtime.onMessage.addListener(
      (
        message: ContentInboundMessage,
        _sender,
        sendResponse: (response?: unknown) => void,
      ) => {
        if (message.type === 'SHOWCASE_PING') {
          sendResponse({ type: 'SHOWCASE_PONG' });
          return true;
        }

        if (message.type === 'SHOWCASE_DETECT') {
          const result = autoDetectSections();
          sendResponse({
            type: 'SHOWCASE_DETECT_RESULT',
            stops: result.stops,
            truncated: result.truncated,
          });
          return true;
        }

        if (message.type === 'SHOWCASE_STOP') {
          if (running) {
            abortActiveTour();
            sendResponse({ ok: true });
          } else {
            sendResponse({ ok: true, ignored: true });
          }
          return true;
        }

        if (message.type === 'SHOWCASE_START') {
          if (running) {
            sendResponse({ ok: false, error: 'Tour already running' });
            return true;
          }

          if (!message.config.stops.length) {
            sendResponse({ ok: false, error: 'No sections configured' });
            return true;
          }

          void startTour(message.config);
          sendResponse({ ok: true });
          return true;
        }

        return false;
      },
    );
  },
});
