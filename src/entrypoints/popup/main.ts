import type {
  BackgroundRequest,
  BackgroundResponse,
  PopupInboundMessage,
} from '../../types/messages';
import type { ShowcaseConfig } from '../../types/showcase';
import { DEFAULT_CONFIG } from '../../defaults';

const hostnameEl = document.getElementById('hostname')!;
const statusEl = document.getElementById('status')!;
const detectInfoEl = document.getElementById('detect-info') as HTMLParagraphElement;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const configureBtn = document.getElementById('configure-btn') as HTMLButtonElement;
const headerOffsetInput = document.getElementById(
  'header-offset',
) as HTMLInputElement;
const scrollSpeedInput = document.getElementById(
  'scroll-speed',
) as HTMLInputElement;
const countdownInput = document.getElementById('countdown') as HTMLInputElement;

let activeTabId: number | null = null;
let activeHostname = '';
let currentConfig: ShowcaseConfig | null = null;
let tourRunning = false;

async function sendBackground(
  message: BackgroundRequest,
): Promise<BackgroundResponse> {
  return chrome.runtime.sendMessage(message) as Promise<BackgroundResponse>;
}

function setStatus(text: string): void {
  statusEl.textContent = text;
}

function applyQuickSettingsToConfig(config: ShowcaseConfig): ShowcaseConfig {
  return {
    ...config,
    headerOffsetPx: Number(headerOffsetInput.value) || DEFAULT_CONFIG.headerOffsetPx,
    sectionScrollPixelsPerSecond:
      Number(scrollSpeedInput.value) || DEFAULT_CONFIG.sectionScrollPixelsPerSecond,
    countdownSeconds:
      Number(countdownInput.value) ?? DEFAULT_CONFIG.countdownSeconds,
  };
}

function populateQuickSettings(config: ShowcaseConfig): void {
  headerOffsetInput.value = String(config.headerOffsetPx);
  scrollSpeedInput.value = String(config.sectionScrollPixelsPerSecond);
  countdownInput.value = String(config.countdownSeconds);
}

async function loadSiteConfig(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('http')) {
    setStatus('Open a webpage to use Webpage Showcase');
    startBtn.disabled = true;
    return;
  }

  activeTabId = tab.id;
  activeHostname = new URL(tab.url).hostname;
  hostnameEl.textContent = activeHostname;

  const response = await sendBackground({
    type: 'GET_SITE_CONFIG',
    hostname: activeHostname,
  });

  if (!response.ok || !response.config) {
    setStatus(response.ok ? 'Ready' : response.error);
    return;
  }

  currentConfig = response.config;
  populateQuickSettings(response.config);

  if (response.hasSavedConfig && response.config.stops.length) {
    detectInfoEl.hidden = true;
    setStatus(`Ready — ${response.config.stops.length} sections configured`);
  } else {
    detectInfoEl.hidden = false;
    detectInfoEl.textContent =
      'No saved config — sections will be auto-detected on first start';
    setStatus('Ready');
  }
}

async function saveQuickSettings(): Promise<void> {
  if (!currentConfig || !activeHostname) return;

  const updated = applyQuickSettingsToConfig(currentConfig);
  currentConfig = updated;

  await sendBackground({
    type: 'SAVE_SITE_CONFIG',
    hostname: activeHostname,
    config: {
      stops: updated.stops,
      globalOverrides: {
        headerOffsetPx: updated.headerOffsetPx,
        sectionScrollPixelsPerSecond: updated.sectionScrollPixelsPerSecond,
        countdownSeconds: updated.countdownSeconds,
      },
      updatedAt: new Date().toISOString(),
    },
  });
}

async function startShowcase(): Promise<void> {
  if (!activeTabId || !activeHostname || tourRunning) return;

  await saveQuickSettings();

  startBtn.disabled = true;
  stopBtn.disabled = false;
  tourRunning = true;
  setStatus(`Running on ${activeHostname}`);

  const response = await sendBackground({
    type: 'START_SHOWCASE',
    tabId: activeTabId,
    hostname: activeHostname,
  });

  if (!response.ok) {
    tourRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus(`Error: ${response.error}`);
    return;
  }

  if (response.config) {
    currentConfig = response.config;
    detectInfoEl.hidden = false;
    detectInfoEl.textContent = `Using ${response.config.stops.length} sections`;
  }
}

async function stopShowcase(): Promise<void> {
  if (!activeTabId) return;

  await sendBackground({ type: 'STOP_SHOWCASE', tabId: activeTabId });
  tourRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setStatus('Tour stopped');
}

function openOptions(): void {
  const url = chrome.runtime.getURL(
    `options.html${activeHostname ? `?hostname=${encodeURIComponent(activeHostname)}` : ''}`,
  );
  void chrome.tabs.create({ url });
}

chrome.runtime.onMessage.addListener((message: PopupInboundMessage) => {
  if (message.type === 'SHOWCASE_STATUS') {
    setStatus(message.message);
  }

  if (message.type === 'SHOWCASE_COMPLETE') {
    tourRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus('Complete');
  }

  if (message.type === 'SHOWCASE_ERROR') {
    tourRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus(`Error: ${message.error}`);
  }
});

startBtn.addEventListener('click', () => void startShowcase());
stopBtn.addEventListener('click', () => void stopShowcase());
configureBtn.addEventListener('click', openOptions);

for (const input of [headerOffsetInput, scrollSpeedInput, countdownInput]) {
  input.addEventListener('change', () => void saveQuickSettings());
}

void loadSiteConfig();
