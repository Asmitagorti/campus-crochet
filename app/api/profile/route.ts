import { requireCaller } from "@/lib/auth";

const ALLOWED = ["full_name", "phone_number", "branch", "year"] as const;

/**
 * GET /api/profile — own profile row (auto-created on first login if missing).
 * PATCH /api/profile — update allowed fields only. Email/role/user_id are
 * immutable here; role can never be escalated through this endpoint.
 */
export async function GET(req: Request) {
  try {
    const { caller, db } = await requireCaller(req);
    const { data, error } = await db
      .from("users")
      .select("user_id, email, full_name, phone_number, branch, year, role, created_at")
      .eq("user_id", caller.id)
      .maybeSingle();
    if (error) {
      console.error("PROFILE GET ERROR:", error);
      return Response.json({ error: "Could not load your profile. Please try again." }, { status: 500 });
    }
    if (!data) {
      return Response.json({
        user_id: caller.id,
        email: caller.email,
        full_name: null,
        phone_number: null,
        branch: null,
        year: null,
        role: "customer",
        created_at: null,
      });
    }
    return Response.json(data);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("PROFILE GET ERROR:", res);
    return Response.json({ error: "Could not load your profile. Please try again." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { caller, db } = await requireCaller(req);
    const body = await req.json().catch(() => ({}));

    const patch: Record<string, string | null> = {};
    for (const k of ALLOWED) {
      if (body[k] !== undefined) {
        const v = typeof body[k] === "string" ? body[k].trim() : "";
        patch[k] = v === "" ? null : v;
      }
    }
    if (patch.full_name !== undefined && !patch.full_name) {
      return Response.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (patch.phone_number && !/^[0-9+\-\s]{10,15}$/.test(patch.phone_number)) {
      return Response.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }

    const { data, error } = await db
      .from("users")
      .update(patch)
      .eq("user_id", caller.id)
      .select("user_id, email, full_name, phone_number, branch, year, role, created_at")
      .maybeSingle();
    if (error) {
      console.error("PROFILE PATCH ERROR:", error);
      return Response.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
    }
    if (!data) {
      // Row missing (signed in before profile creation) — create it now.
      const { data: created, error: insErr } = await db
        .from("users")
        .insert({ user_id: caller.id, email: caller.email, role: "customer", ...patch })
        .select("user_id, email, full_name, phone_number, branch, year, role, created_at")
        .maybeSingle();
      if (insErr) {
        console.error("PROFILE CREATE ERROR:", insErr);
        return Response.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
      }
      return Response.json(created);
    }
    return Response.json(data);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("PROFILE PATCH ERROR:", res);
    return Response.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
  }
}
