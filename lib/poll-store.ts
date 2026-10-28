import "server-only";
import { adminDatabase } from "./supabase-admin";

export type PollOption = { id: string; title: string; description: string; imageUrl: string; position: number };
export type PollPublic = { id: string; title: string; description: string; openedAt: string | null; options: PollOption[] };
export type PollResult = { totalVoters: number; options: { id: string; votes: number }[] };

export async function loadActivePoll(): Promise<PollPublic | null> {
  const db = adminDatabase();
  const { data: state, error: stateError } = await db.from("site_runtime")
    .select("mode,active_poll_id").eq("id", true).single();
  if (stateError) throw stateError;
  if (state.mode !== "poll" || !state.active_poll_id) return null;
  const [{ data: round, error: roundError }, { data: options, error: optionsError }] = await Promise.all([
    db.from("poll_rounds").select("id,title,description,opened_at,status").eq("id", state.active_poll_id).single(),
    db.from("poll_options").select("id,title,description,image_url,position").eq("round_id", state.active_poll_id)
      .order("position").order("created_at"),
  ]);
  if (roundError) throw roundError;
  if (optionsError) throw optionsError;
  if (round.status !== "open") return null;
  return { id: round.id, title: round.title, description: round.description,
    openedAt: round.opened_at,
    options: (options || []).map((option) => ({ id: option.id, title: option.title,
      description: option.description, imageUrl: option.image_url, position: option.position })) };
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
