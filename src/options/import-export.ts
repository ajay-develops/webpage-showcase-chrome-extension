import type { StorageSchema } from '../types/showcase';

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<StorageSchema> {
  const text = await file.text();
  const parsed: unknown = JSON.parse(text);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON: expected an object');
  }

  return parsed as StorageSchema;
}

export function mergeStorageSchemas(
  current: StorageSchema,
  incoming: StorageSchema,
): StorageSchema {
  return { ...current, ...incoming };
}
