import "server-only";
import { firestore } from "./firebase-admin";
import { journal, JournalEntry } from "./journal";
import { defaultSettings, SiteSettings } from "./site-settings";
export async function loadSettings() {
  const doc = await firestore().doc("site_content/settings").get();
  const data = doc.data() || {};
  return Object.fromEntries(
    Object.entries(defaultSettings).map(([key, fallback]) => [
      key,
      typeof data[key] === "string" ? data[key] : fallback,
    ]),
  ) as SiteSettings;
}
export async function loadJournal(): Promise<JournalEntry[]> {
  const data = await firestore()
    .collection("journey")
    .where("published", "==", true)
    .get();
  return data.docs
    .map((d) => ({ ...d.data(), slug: d.id }) as JournalEntry)
    .sort(
      (a, b) =>
        journal.findIndex((p) => p.slug === a.slug) -
        journal.findIndex((p) => p.slug === b.slug),
    );
}
