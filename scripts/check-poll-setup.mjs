import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey || !anonKey) throw Error("Supabase environment is incomplete.");
const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const checks = [
  ["mode", () => service.from("site_runtime").select("mode,active_poll_id").eq("id", true).single()],
  ["rounds", () => service.from("poll_rounds").select("id", { count: "exact", head: true })],
  ["options", () => service.from("poll_options").select("id", { count: "exact", head: true })],
  ["ballots", () => service.from("poll_ballots").select("round_id", { count: "exact", head: true })],
  ["visits", () => service.from("site_analytics_visits").select("visit_id", { count: "exact", head: true })],
  ["optouts", () => service.from("site_analytics_optouts").select("visitor_hash", { count: "exact", head: true })],
  ["analytics", () => service.rpc("site_analytics_summary")],
  ["results", () => service.rpc("poll_results", { p_round: "00000000-0000-4000-8000-000000000000" })],
  ["anon runtime", () => anon.from("site_runtime").select("mode")],
  ["anon ballots", () => anon.from("poll_ballots").select("user_id")],
  ["anon visits", () => anon.from("site_analytics_visits").select("visitor_id")],
  ["anon results", () => anon.rpc("poll_results", { p_round: "00000000-0000-4000-8000-000000000000" })],
];
for (const [name, check] of checks) {
  const result = await check();
  if (name.startsWith("anon ")) {
    if (name === "anon results" && !result.error) throw Error("Public callers can execute results RPC");
    if (name !== "anon results" && !result.error && result.data?.length) throw Error(`${name} unexpectedly exposed rows`);
    console.log(`${name}: inaccessible`);
  } else {
    if (result.error) throw Error(`${name}: ${result.error.message}`);
    if (name === "mode") console.log(`mode: ${result.data.mode}, active poll: ${result.data.active_poll_id ? "yes" : "no"}`);
    else if (name === "analytics") {
      if (result.data?.todayVisits === undefined) throw Error("Visit totals are missing");
      console.log("analytics RPC: available with visit counts");
    }
    else if (name === "results") console.log("results RPC: available");
    else console.log(`${name}: ${result.count ?? 0}`);
  }
}
const fake = "00000000-0000-4000-8000-000000000000";
const claim = await service.rpc("shop_claim_gateway", { p_id: fake, p_claim: fake });
if (!claim.error?.message.includes("Shopping is unavailable"))
  throw Error("Gateway claim was not blocked by poll mode");
console.log("gateway claim: blocked in poll mode");
const attach = await service.rpc("cc_attach_gateway", { p_id: fake, p_claim: fake, p_gateway: "order_test_not_real" });
if (!attach.error?.message.includes("Shopping is unavailable"))
  throw Error("Gateway attachment was not blocked by poll mode");
console.log("gateway attachment: blocked in poll mode");
