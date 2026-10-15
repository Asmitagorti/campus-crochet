import { requireCaller } from "@/lib/auth";

const STATUSES = ["pending", "accepted", "rejected", "completed"];

/**
 * PATCH /api/custom-requests/:id — admin only.
 * Admins may change status and leave an in-app response (admin_note).
 * Customers cannot change status; the response is visible in their tracker.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { caller, db } = await requireCaller(req);
    const { id } = await params;

    if (!caller.isAdmin) {
      return Response.json({ error: "Admin access only." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return Response.json({ error: "Please choose a valid status." }, { status: 400 });
      }
      patch.status = body.status;
    }
    if (body.admin_note !== undefined) {
      patch.admin_note = String(body.admin_note).trim().slice(0, 2000) || null;
    }
    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from("custom_requests")
      .update(patch)
      .eq("request_id", id)
      .select()
      .maybeSingle();
    if (error) {
      console.error("CUSTOM REQUEST PATCH ERROR:", error);
      return Response.json({ error: "Could not update the request. Please try again." }, { status: 500 });
    }
    if (!data) return Response.json({ error: "Request not found." }, { status: 404 });
    return Response.json(data);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("CUSTOM REQUEST PATCH ERROR:", res);
    return Response.json({ error: "Could not update the request. Please try again." }, { status: 500 });
  }
}
