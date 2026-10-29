import "server-only";
import { adminDatabase } from "./supabase-admin";
import { pollImageUrls } from "./poll-domain";

export type PollOption = { id: string; title: string; description: string; imageUrl: string; imageUrls: string[]; position: number };
export type PollPublic = { id: string; title: string; description: string; openedAt: string | null; options: PollOption[] };
export type PollResult = { totalVoters: number; options: { id: string; votes: number }[] };

export async function requireFinalPollMigration(): Promise<void> {
  const { error } = await adminDatabase().from("poll_options").select("hidden_at").limit(1);
  if (error) throw Error("Run the final poll migration in Supabase before voting or opening a poll.");
}

export async function loadActivePoll(): Promise<PollPublic | null> {
  const db = adminDatabase();
  const { data: state, error: stateError } = await db.from("site_runtime")
    .select("mode,active_poll_id").eq("id", true).single();
  if (stateError) throw stateError;
  if (state.mode !== "poll" || !state.active_poll_id) return null;
  const [{ data: round, error: roundError }, { data: options, error: optionsError }] = await Promise.all([
    db.from("poll_rounds").select("id,title,description,opened_at,status").eq("id", state.active_poll_id).single(),
    db.from("poll_options").select("*").eq("round_id", state.active_poll_id)
      .order("position").order("created_at"),
  ]);
  if (roundError) throw roundError;
  if (optionsError) throw optionsError;
  if (round.status !== "open") return null;
  return { id: round.id, title: round.title, description: round.description,
    openedAt: round.opened_at,
    options: (options || []).filter((option) => !option.hidden_at).map((option) => ({ id: option.id, title: option.title,
      description: option.description, imageUrl: option.image_url,
      imageUrls: pollImageUrls(option.image_url, option.image_urls), position: option.position })) };
}

export async function loadPollResults(roundId: string): Promise<PollResult> {
  const { data, error } = await adminDatabase().rpc("poll_results", { p_round: roundId });
  if (error) throw error;
  return data as PollResult;
}

export async function loadMyPollVotes(roundId: string, userId: string): Promise<string[] | null> {
  const db = adminDatabase();
  const { data: ballot, error: ballotError } = await db.from("poll_ballots")
    .select("round_id").eq("round_id", roundId).eq("user_id", userId).maybeSingle();
  if (ballotError) throw ballotError;
  if (!ballot) return null;
  const { data, error } = await db.from("poll_votes").select("option_id")
    .eq("round_id", roundId).eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((row) => row.option_id);
}
