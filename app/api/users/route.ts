import { requireAdmin } from "@/lib/auth";

// GET /api/users → admin only (dashboard stats). Customers must never list users.
export async function GET(req: Request) {
  try {
    const { db } = await requireAdmin(req);
    const { data, error } = await db
      .from("users")
      .select("user_id, email, full_name, role, year, branch, phone_number, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPABASE USERS ERROR:", error);
      return Response.json({ error: "Could not load users. Please try again." }, { status: 500 });
    }
    return Response.json(data ?? []);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("USERS GET ERROR:", res);
    return Response.json({ error: "Could not load users. Please try again." }, { status: 500 });
  }
}
