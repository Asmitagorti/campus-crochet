const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && uuid.test(value);

export type ActiveWindow = { at: number; active: boolean; milliseconds: number };
export function advanceActiveWindow(window: ActiveWindow, at: number, active: boolean): ActiveWindow {
  const elapsed = Number.isFinite(at) ? Math.max(0, at - window.at) : 0;
  return { at, active, milliseconds: window.milliseconds + (window.active ? elapsed : 0) };
}

export function clampActiveSeconds(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return 0;
  return Math.min(30, Math.floor(value));
}
