export interface InngestStep {
  run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  sleep: (name: string, duration: string) => Promise<void>;
  sendEvent: (
    name: string,
    payload: { name: string; data: Record<string, unknown> }
  ) => Promise<unknown>;
}

export interface SeedCatalogEvent {
  data: {
    targetCount?: number;
  };
}

export interface SyncLibraryEvent {
  data: {
    userId: string;
    steamId: string;
  };
}
