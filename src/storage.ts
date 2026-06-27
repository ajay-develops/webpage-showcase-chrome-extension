import { DEFAULT_CONFIG } from './defaults';
import type {
  ShowcaseConfig,
  ShowcaseGlobalConfig,
  StorageSchema,
  StoredSiteConfig,
} from './types/showcase';
import { GLOBAL_DEFAULTS_KEY } from './types/showcase';

const STORAGE_KEY = 'pageShowcaseConfigs';

async function readSchema(): Promise<StorageSchema> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const schema = result[STORAGE_KEY];
  if (!schema || typeof schema !== 'object') {
    return {};
  }
  return schema as StorageSchema;
}

async function writeSchema(schema: StorageSchema): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: schema });
}

export async function getStoredSiteConfig(
  hostname: string,
): Promise<StoredSiteConfig | null> {
  const schema = await readSchema();
  return schema[hostname] ?? null;
}

export async function saveStoredSiteConfig(
  hostname: string,
  config: StoredSiteConfig,
): Promise<void> {
  const schema = await readSchema();
  schema[hostname] = config;
  await writeSchema(schema);
}

export async function getGlobalOverrides(): Promise<Partial<ShowcaseGlobalConfig>> {
  const schema = await readSchema();
  return schema[GLOBAL_DEFAULTS_KEY]?.globalOverrides ?? {};
}

export async function saveGlobalOverrides(
  overrides: Partial<ShowcaseGlobalConfig>,
): Promise<void> {
  const schema = await readSchema();
  const existing = schema[GLOBAL_DEFAULTS_KEY];
  schema[GLOBAL_DEFAULTS_KEY] = {
    stops: existing?.stops ?? [],
    globalOverrides: overrides,
    updatedAt: new Date().toISOString(),
  };
  await writeSchema(schema);
}

export async function getAllHostnames(): Promise<string[]> {
  const schema = await readSchema();
  return Object.keys(schema).filter((key) => key !== GLOBAL_DEFAULTS_KEY);
}

export async function getFullStorageSchema(): Promise<StorageSchema> {
  return readSchema();
}

export async function importStorageSchema(schema: StorageSchema): Promise<void> {
  await writeSchema(schema);
}

export function mergeShowcaseConfig(
  stored: StoredSiteConfig | null,
  globalOverrides: Partial<ShowcaseGlobalConfig>,
): ShowcaseConfig {
  const base: ShowcaseGlobalConfig = {
    ...DEFAULT_CONFIG,
    ...globalOverrides,
    ...(stored?.globalOverrides ?? {}),
  };

  return {
    ...base,
    stops: stored?.stops ?? [],
  };
}

export async function buildShowcaseConfigForHostname(
  hostname: string,
): Promise<{ config: ShowcaseConfig; hasSavedConfig: boolean }> {
  const [stored, globalOverrides] = await Promise.all([
    getStoredSiteConfig(hostname),
    getGlobalOverrides(),
  ]);

  const hasSavedConfig = Boolean(stored?.stops?.length);
  return {
    config: mergeShowcaseConfig(stored, globalOverrides),
    hasSavedConfig,
  };
}
