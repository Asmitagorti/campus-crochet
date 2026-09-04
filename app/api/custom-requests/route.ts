import { supabase } from "@/lib/supabase";
import { getSession, isAdmin } from "@/lib/auth";

const TABLE = "custom_requests";
const STATUSES = new Set([
  "pending",
  "accepted",
  "rejected",
  "counter_offered",
  "student_accepted",
  "in_production",
  "ready",
  "completed",
]);

async function tableExists(name: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(name).select("*").limit(0);
    if (!error) return true;
    const msg = error.message?.toLowerCase() ?? "";
    return !msg.includes("does not exist") && !msg.includes("not found");
  } catch {
    return false;
  }
}

function unavailable() {
  return Response.json(
    {
      error:
        "Custom requests are not configured. The 'custom_requests' table does not exist. Please run the SQL migration to create it.",
    },
    { status: 501 }
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await tableExists(TABLE))) return unavailable();

  let query = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (isAdmin(session)) {
    // admin can see all
  } else {
    query = query.eq("user_id", session.id);
  }

  const { data, error } = await query;
  if (error) {
    console.error("SUPABASE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await tableExists(TABLE))) return unavailable();

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const name = body.name;
  const item_name = body.item_name;
  if (typeof name !== "string" || typeof item_name !== "string") {
    return Response.json({ error: "name and item_name are required" }, { status: 400 });
  }

  const insertRow: Record<string, unknown> = {
    user_id: session.id,
    name,
    item_name,
    status: "pending",
  };
  if (typeof body.occasion === "string") insertRow.occasion = body.occasion;
  if (typeof body.colors === "string") insertRow.colors = body.colors;
  if (typeof body.email === "string") insertRow.email = body.email;
  else insertRow.email = session.email;
  if (typeof body.description === "string") insertRow.description = body.description;
  if (typeof body.budget === "number") insertRow.budget = body.budget;

  const { data, error } = await supabase.from(TABLE).insert(insertRow).select().single();
  if (error) {
    console.error("CUSTOM REQUEST INSERT ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await tableExists(TABLE))) return unavailable();

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const { request_id, status } = body;
  if (typeof request_id !== "string" || typeof status !== "string" || !STATUSES.has(status)) {
    return Response.json({ error: "request_id and valid status required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", request_id)
    .maybeSingle();

  if (!existing) return Response.json({ error: "Request not found" }, { status: 404 });

  const admin = isAdmin(session);
  const ownsRequest = (existing as { user_id?: string }).user_id === session.id;

  const adminStatuses = new Set(["accepted", "rejected", "counter_offered", "in_production", "ready", "completed"]);
  const studentStatuses = new Set(["student_accepted"]);

  if (adminStatuses.has(status) && !admin) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }
  if (studentStatuses.has(status) && !ownsRequest && !admin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateRow: Record<string, unknown> = { status };
  if (admin) {
    if (body.admin_price !== undefined) updateRow.admin_price = body.admin_price;
    if (body.admin_notes !== undefined) updateRow.admin_notes = body.admin_notes;
  }
  if (body.student_response !== undefined) updateRow.student_response = body.student_response;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updateRow)
    .eq("id", request_id)
    .select()
    .single();

  if (error) {
    console.error("CUSTOM REQUEST UPDATE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data);
}