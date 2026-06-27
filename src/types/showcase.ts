export type ShowcaseStop = {
  selector: string;
  label?: string;
  startPauseMs?: number;
  endPauseMs?: number;
};

export type ShowcaseGlobalConfig = {
  headerOffsetPx: number;
  fastTransitionDurationMs: number;
  sectionScrollPixelsPerSecond: number;
  minSectionScrollDurationMs: number;
  maxSectionScrollDurationMs: number;
  sectionStartPauseMs: number;
  heroSectionStartPauseMs: number;
  introDelayMs: number;
  countdownSeconds: number;
};

export type ShowcaseConfig = ShowcaseGlobalConfig & {
  stops: ShowcaseStop[];
};

export type ShowcaseStatusHandler = (message: string) => void;

export type ShowcaseTourHandle = {
  abort: () => void;
  done: Promise<void>;
};

export type StoredSiteConfig = {
  stops: ShowcaseStop[];
  globalOverrides?: Partial<ShowcaseGlobalConfig>;
  updatedAt: string;
};

export type StorageSchema = Record<string, StoredSiteConfig>;

export const GLOBAL_DEFAULTS_KEY = '_global';
