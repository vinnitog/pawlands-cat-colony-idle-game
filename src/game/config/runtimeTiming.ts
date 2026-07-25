export const LOCAL_DEV_DURATION_MS = 10_000;

const usesFastLocalTiming =
  import.meta.env?.DEV === true && import.meta.env.MODE === 'development';

export function getRuntimeDurationMs(officialDurationMs: number): number {
  return usesFastLocalTiming ? LOCAL_DEV_DURATION_MS : officialDurationMs;
}
