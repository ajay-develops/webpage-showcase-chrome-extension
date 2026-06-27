import type {
  ShowcaseConfig,
  ShowcaseStatusHandler,
  ShowcaseTourHandle,
} from '../types/showcase';

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getSectionScrollBounds(
  element: Element,
  headerOffset = 80,
): { startY: number; endY: number } {
  const rect = element.getBoundingClientRect();
  const elementTop = window.scrollY + rect.top;
  const elementBottom = elementTop + rect.height;
  const startY = Math.max(0, elementTop - headerOffset);
  const endY = Math.max(
    startY,
    elementBottom - window.innerHeight + headerOffset,
  );
  return { startY, endY };
}

export function getSectionScrollDuration(
  startY: number,
  endY: number,
  pixelsPerSecond: number,
  minMs: number,
  maxMs: number,
): number {
  const distance = endY - startY;
  if (distance <= 1) return minMs;
  const duration = (distance / pixelsPerSecond) * 1000;
  return Math.min(maxMs, Math.max(minMs, duration));
}

let smoothScrollState: {
  hadSmoothClass: boolean;
  previousScrollBehavior: string;
} | null = null;

export function disableSmoothScroll(): void {
  const html = document.documentElement;
  const hadSmoothClass = html.classList.contains('scroll-smooth');
  const previousScrollBehavior = html.style.scrollBehavior;
  html.classList.remove('scroll-smooth');
  html.style.scrollBehavior = 'auto';
  smoothScrollState = { hadSmoothClass, previousScrollBehavior };
}

export function restoreSmoothScroll(): void {
  if (!smoothScrollState) return;
  const html = document.documentElement;
  if (smoothScrollState.hadSmoothClass) {
    html.classList.add('scroll-smooth');
  }
  html.style.scrollBehavior = smoothScrollState.previousScrollBehavior;
  smoothScrollState = null;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function animateScrollY(
  targetY: number,
  durationMs: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 0.5 || durationMs <= 0) {
      window.scrollTo(0, targetY);
      resolve();
      return;
    }

    const startTime = performance.now();
    let frameId = 0;

    const onAbort = () => {
      cancelAnimationFrame(frameId);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const tick = (now: number) => {
      if (signal?.aborted) {
        onAbort();
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    frameId = requestAnimationFrame(tick);
  });
}

export type ScrollThroughSectionOptions = {
  headerOffset: number;
  pixelsPerSecond: number;
  minDurationMs: number;
  maxDurationMs: number;
  signal?: AbortSignal;
};

export async function scrollThroughSection(
  element: Element,
  options: ScrollThroughSectionOptions,
): Promise<void> {
  const { startY, endY } = getSectionScrollBounds(
    element,
    options.headerOffset,
  );
  const duration = getSectionScrollDuration(
    startY,
    endY,
    options.pixelsPerSecond,
    options.minDurationMs,
    options.maxDurationMs,
  );
  await animateScrollY(endY, duration, options.signal);
}

export function runShowcaseTour(
  config: ShowcaseConfig,
  onStatus?: ShowcaseStatusHandler,
): ShowcaseTourHandle {
  const controller = new AbortController();
  const { signal } = controller;

  let resolveDone!: () => void;
  let rejectDone!: (reason?: unknown) => void;
  const done = new Promise<void>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const run = async () => {
    disableSmoothScroll();
    try {
      for (let i = 0; i < config.stops.length; i++) {
        const stop = config.stops[i];
        if (!stop) continue;

        const element = document.querySelector(stop.selector);
        if (!element) continue;

        const label = stop.label ?? stop.selector;
        onStatus?.(`Tour: ${label}`);

        const { startY } = getSectionScrollBounds(
          element,
          config.headerOffsetPx,
        );

        await animateScrollY(
          startY,
          config.fastTransitionDurationMs,
          signal,
        );

        const startPause =
          i === 0
            ? config.heroSectionStartPauseMs
            : (stop.startPauseMs ?? config.sectionStartPauseMs);
        await sleep(startPause, signal);

        onStatus?.(`Showcasing: ${label}`);

        await scrollThroughSection(element, {
          headerOffset: config.headerOffsetPx,
          pixelsPerSecond: config.sectionScrollPixelsPerSecond,
          minDurationMs: config.minSectionScrollDurationMs,
          maxDurationMs: config.maxSectionScrollDurationMs,
          signal,
        });

        if (stop.endPauseMs) {
          await sleep(stop.endPauseMs, signal);
        }
      }

      onStatus?.('Tour complete');
      resolveDone();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        onStatus?.('Tour stopped');
        resolveDone();
      } else {
        rejectDone(error);
      }
    } finally {
      restoreSmoothScroll();
    }
  };

  void run();

  return {
    abort: () => controller.abort(),
    done,
  };
}
