import type { Metadata } from "next";
import VotePage from "@/components/vote-page";
import { loadActivePoll } from "@/lib/poll-store";

export const metadata: Metadata = {
  title: "Vote for what comes next | Campus Crochet",
  description: "Pick the crochet designs you would love to see from Campus Crochet.",
};
export const dynamic = "force-dynamic";

export default async function Vote() {
  let poll = null;
  try { poll = await loadActivePoll(); } catch { /* The migration may not be installed yet. */ }
  return <VotePage initialPoll={poll} />;
}
