export function parseSiteMode(value: unknown): "shop" | "poll" {
  if (value === "shop" || value === "poll") return value;
  throw Error("Site mode is unavailable.");
}
export function assertShoppingEnabled(value: unknown): void {
  if (value !== "shop") throw Error("Shopping is unavailable while the design poll is open.");
}
export function parseBallotOptionIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20)
    throw Error("Choose between one and twenty designs.");
  if (!value.every((id) => typeof id === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)))
    throw Error("One of the selected designs is invalid.");
  if (new Set(value).size !== value.length) throw Error("Choose each design only once.");
  return value;
}

export function publicPollResults<T extends { totalVoters: number; options: { id: string; votes: number }[] }>(
  results: T,
  visibleIds: string[],
): T {
  const visible = new Set(visibleIds);
  return { ...results, options: results.options.filter((option) => visible.has(option.id)) };
}

export function withdrawnVoteCount(selected: string[], visibleIds: string[]): number {
  const visible = new Set(visibleIds);
  return selected.filter((id) => !visible.has(id)).length;
}

export function visibleDraftSelections(selected: string[], visibleIds: string[]): string[] {
  const visible = new Set(visibleIds);
  return selected.filter((id) => visible.has(id));
}
