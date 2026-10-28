import { adminDatabase, requireUser } from "@/lib/supabase-admin";
import { errorResponse } from "@/lib/forms";
import { adminRoleForEmail } from "@/lib/admin-identity";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const db = adminDatabase();
    const role = adminRoleForEmail(user.email);
    const { data: profile, error: readError } = await db.from("users").select("user_id,role").eq("user_id", user.uid).maybeSingle();
    if (readError) throw readError;
    if (!profile) {
      const { error } = await db.from("users").insert({ user_id: user.uid, email: user.email, full_name: user.name, role });
      if (error && error.code !== "23505") throw error;
    } else {
      const updates: Record<string, unknown> = { email: user.email, full_name: user.name };
      if (profile.role !== role) updates.role = role;
      const { error } = await db.from("users").update(updates).eq("user_id", user.uid);
      if (error) throw error;
    }
    return Response.json({ admin: role === "admin" });
  } catch (e) {
    return errorResponse(e, 401);
  }
}
