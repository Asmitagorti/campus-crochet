import map from "./media-map.json";
export const media = (path: string) =>
  (map as Record<string, string>)[path] || path;
