import { sleep } from './showcase-engine';

const OVERLAY_CLASS = 'page-showcase-overlay';
const BODY_MODE_CLASS = 'page-showcase-mode';

let overlayEl: HTMLDivElement | null = null;
let hiddenElements: Array<{ el: HTMLElement; previousDisplay: string }> = [];

function getOverlayStyles(): string {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bg = isDark ? 'rgba(17, 17, 17, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  const color = isDark ? '#f5f5f5' : '#111111';
  const border = isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)';

  return [
    'position:fixed',
    'bottom:1.5rem',
    'left:1.5rem',
    'z-index:2147483646',
    'pointer-events:none',
    'padding:0.55rem 1rem',
    'border-radius:9999px',
    `border:${border}`,
    `background:${bg}`,
    `color:${color}`,
    'font:600 13px/1.4 system-ui,-apple-system,sans-serif',
    'backdrop-filter:blur(8px)',
    '-webkit-backdrop-filter:blur(8px)',
    'box-shadow:0 4px 24px rgba(0,0,0,0.12)',
    'max-width:min(90vw,28rem)',
    'white-space:nowrap',
    'overflow:hidden',
    'text-overflow:ellipsis',
  ].join(';');
}

export function createOverlay(initialText = ''): HTMLDivElement {
  removeOverlay();

  overlayEl = document.createElement('div');
  overlayEl.className = OVERLAY_CLASS;
  overlayEl.setAttribute('aria-live', 'polite');
  overlayEl.setAttribute('role', 'status');
  overlayEl.style.cssText = getOverlayStyles();
  overlayEl.textContent = initialText;
  document.body.appendChild(overlayEl);
  return overlayEl;
}

export function setOverlayText(text: string): void {
  if (!overlayEl) {
    createOverlay(text);
    return;
  }
  overlayEl.textContent = text;
}

export function removeOverlay(): void {
  overlayEl?.remove();
  overlayEl = null;
}

export function showTourMode(): void {
  document.body.classList.add(BODY_MODE_CLASS);

  hiddenElements = [];
  for (const el of document.querySelectorAll<HTMLElement>('[data-showcase-hide]')) {
    hiddenElements.push({ el, previousDisplay: el.style.display });
    el.style.display = 'none';
  }
}

export function hideTourMode(): void {
  document.body.classList.remove(BODY_MODE_CLASS);

  for (const { el, previousDisplay } of hiddenElements) {
    el.style.display = previousDisplay;
  }
  hiddenElements = [];
}

export async function runCountdown(
  seconds: number,
  onTick: (remaining: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  for (let remaining = seconds; remaining >= 1; remaining--) {
    onTick(remaining);
    await sleep(1000, signal);
  }
}

export function registerEscListener(onEsc: () => void): () => void {
  const handler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEsc();
    }
  };

  window.addEventListener('keydown', handler, true);
  return () => window.removeEventListener('keydown', handler, true);
}

export function hasScrollBlockingOverflow(): boolean {
  const bodyOverflow = window.getComputedStyle(document.body).overflow;
  const htmlOverflow = window.getComputedStyle(document.documentElement).overflow;
  return bodyOverflow === 'hidden' || htmlOverflow === 'hidden';
}
