import { DEFAULT_CONFIG } from '../../defaults';
import {
  downloadJson,
  mergeStorageSchemas,
  readJsonFile,
} from '../../options/import-export';
import {
  getFullStorageSchema,
  getStoredSiteConfig,
  importStorageSchema,
  saveStoredSiteConfig,
} from '../../storage';
import type {
  BackgroundRequest,
  BackgroundResponse,
} from '../../types/messages';
import type { ShowcaseGlobalConfig, ShowcaseStop } from '../../types/showcase';

const hostnameSelect = document.getElementById(
  'hostname-select',
) as HTMLSelectElement;
const saveStatus = document.getElementById('save-status')!;
const stopsList = document.getElementById('stops-list')!;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const redetectBtn = document.getElementById('redetect-btn') as HTMLButtonElement;
const addStopBtn = document.getElementById('add-stop-btn') as HTMLButtonElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const importFile = document.getElementById('import-file') as HTMLInputElement;

const globalFields: Record<keyof ShowcaseGlobalConfig, HTMLInputElement> = {
  headerOffsetPx: document.getElementById('header-offset') as HTMLInputElement,
  fastTransitionDurationMs: document.getElementById(
    'fast-transition',
  ) as HTMLInputElement,
  sectionScrollPixelsPerSecond: document.getElementById(
    'scroll-speed',
  ) as HTMLInputElement,
  minSectionScrollDurationMs: document.getElementById(
    'min-scroll',
  ) as HTMLInputElement,
  maxSectionScrollDurationMs: document.getElementById(
    'max-scroll',
  ) as HTMLInputElement,
  sectionStartPauseMs: document.getElementById('section-pause') as HTMLInputElement,
  heroSectionStartPauseMs: document.getElementById('hero-pause') as HTMLInputElement,
  introDelayMs: document.getElementById('intro-delay') as HTMLInputElement,
  countdownSeconds: document.getElementById('countdown') as HTMLInputElement,
};

let stops: ShowcaseStop[] = [];
let activeHostname = '';

async function sendBackground(
  message: BackgroundRequest,
): Promise<BackgroundResponse> {
  return chrome.runtime.sendMessage(message) as Promise<BackgroundResponse>;
}

function getQueryHostname(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('hostname') ?? '';
}

function readGlobalOverrides(): Partial<ShowcaseGlobalConfig> {
  const overrides: Partial<ShowcaseGlobalConfig> = {};
  for (const [key, input] of Object.entries(globalFields)) {
    const field = key as keyof ShowcaseGlobalConfig;
    const value = Number(input.value);
    if (!Number.isNaN(value)) {
      overrides[field] = value;
    }
  }
  return overrides;
}

function populateGlobalFields(overrides: Partial<ShowcaseGlobalConfig>): void {
  const merged = { ...DEFAULT_CONFIG, ...overrides };
  for (const [key, input] of Object.entries(globalFields)) {
    const field = key as keyof ShowcaseGlobalConfig;
    input.value = String(merged[field]);
  }
}

function renderStops(): void {
  stopsList.innerHTML = '';

  stops.forEach((stop, index) => {
    const row = document.createElement('div');
    row.className = 'stop-row';
    row.innerHTML = `
      <label>Label<input data-field="label" value="${escapeHtml(stop.label ?? '')}" /></label>
      <label>Selector<input data-field="selector" value="${escapeHtml(stop.selector)}" /></label>
      <label>Start pause (ms)<input data-field="startPauseMs" type="number" value="${stop.startPauseMs ?? ''}" /></label>
      <label>End pause (ms)<input data-field="endPauseMs" type="number" value="${stop.endPauseMs ?? ''}" /></label>
      <div class="stop-actions">
        <button type="button" data-action="up" title="Move up">↑</button>
        <button type="button" data-action="down" title="Move down">↓</button>
        <button type="button" data-action="delete" title="Delete">✕</button>
      </div>
    `;

    row.querySelectorAll('input[data-field]').forEach((input) => {
      input.addEventListener('change', () => {
        const field = (input as HTMLInputElement).dataset.field as
          | 'label'
          | 'selector'
          | 'startPauseMs'
          | 'endPauseMs';
        const value = (input as HTMLInputElement).value.trim();

        if (field === 'label') {
          stop.label = value || undefined;
        } else if (field === 'selector') {
          stop.selector = value;
        } else if (field === 'startPauseMs') {
          stop.startPauseMs = value ? Number(value) : undefined;
        } else if (field === 'endPauseMs') {
          stop.endPauseMs = value ? Number(value) : undefined;
        }
      });
    });

    row.querySelector('[data-action="up"]')?.addEventListener('click', () => {
      if (index === 0) return;
      const prev = stops[index - 1];
      const current = stops[index];
      if (!prev || !current) return;
      stops[index - 1] = current;
      stops[index] = prev;
      renderStops();
    });

    row.querySelector('[data-action="down"]')?.addEventListener('click', () => {
      if (index >= stops.length - 1) return;
      const next = stops[index + 1];
      const current = stops[index];
      if (!next || !current) return;
      stops[index + 1] = current;
      stops[index] = next;
      renderStops();
    });

    row.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      stops.splice(index, 1);
      renderStops();
    });

    stopsList.appendChild(row);
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function loadHostnames(selected?: string): Promise<void> {
  const response = await sendBackground({ type: 'GET_ALL_HOSTNAMES' });
  const hostnames = response.ok ? (response.hostnames ?? []) : [];
  const queryHost = getQueryHostname();

  const options = new Set(hostnames);
  if (queryHost) options.add(queryHost);

  hostnameSelect.innerHTML = '';
  for (const hostname of options) {
    const option = document.createElement('option');
    option.value = hostname;
    option.textContent = hostname;
    hostnameSelect.appendChild(option);
  }

  if (options.size === 0) {
    const option = document.createElement('option');
    option.value = queryHost || 'example.com';
    option.textContent = queryHost || 'example.com';
    hostnameSelect.appendChild(option);
  }

  activeHostname = selected ?? queryHost ?? hostnameSelect.value;
  hostnameSelect.value = activeHostname;
  await loadSite(activeHostname);
}

async function loadSite(hostname: string): Promise<void> {
  activeHostname = hostname;
  const stored = await getStoredSiteConfig(hostname);
  stops = stored?.stops ? [...stored.stops] : [];
  populateGlobalFields(stored?.globalOverrides ?? {});
  renderStops();
  saveStatus.textContent = stored
    ? `Loaded ${stops.length} sections`
    : 'No saved config for this site';
}

async function saveSite(): Promise<void> {
  if (!activeHostname) return;

  await saveStoredSiteConfig(activeHostname, {
    stops,
    globalOverrides: readGlobalOverrides(),
    updatedAt: new Date().toISOString(),
  });

  saveStatus.textContent = `Saved ${stops.length} sections for ${activeHostname}`;
}

async function redetectSections(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    saveStatus.textContent = 'Open the target site in a tab to re-detect sections';
    return;
  }

  const confirmed = window.confirm(
    'Replace current sections with auto-detected ones?',
  );
  if (!confirmed) return;

  const response = await sendBackground({
    type: 'DETECT_SECTIONS',
    tabId: tab.id,
  });

  if (!response.ok || !response.stops) {
    saveStatus.textContent = response.ok
      ? 'Detection returned no sections'
      : `Detection failed: ${response.error}`;
    return;
  }

  stops = response.stops;
  renderStops();
  saveStatus.textContent = `Detected ${stops.length} sections${
    response.truncated ? ' (truncated to 20)' : ''
  }`;
}

hostnameSelect.addEventListener('change', () => {
  void loadSite(hostnameSelect.value);
});

saveBtn.addEventListener('click', () => void saveSite());
redetectBtn.addEventListener('click', () => void redetectSections());

addStopBtn.addEventListener('click', () => {
  stops.push({ selector: 'section', label: 'New section' });
  renderStops();
});

exportBtn.addEventListener('click', () => {
  void getFullStorageSchema().then((schema) => {
    downloadJson('webpage-showcase-config.json', schema);
  });
});

importFile.addEventListener('change', () => {
  const file = importFile.files?.[0];
  if (!file) return;

  void readJsonFile(file)
    .then(async (incoming) => {
      const current = await getFullStorageSchema();
      const merged = mergeStorageSchemas(current, incoming);
      await importStorageSchema(merged);
      saveStatus.textContent = 'Import complete';
      await loadHostnames(activeHostname);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Import failed';
      saveStatus.textContent = message;
    })
    .finally(() => {
      importFile.value = '';
    });
});

void loadHostnames();
