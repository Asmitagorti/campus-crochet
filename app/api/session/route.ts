import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { access_token?: unknown };
  const access_token =
    typeof body.access_token === "string" ? body.access_token : null;

  if (!access_token) {
    return NextResponse.json(
      { error: "access_token is required" },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${access_token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    const user = (await res.json()) as { id?: string; email?: string };
    if (!user.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("cc-session", access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60, // 1 hour — matches Supabase access-token JWT expiry
    });

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email ?? "" } });
  } catch (error) {
    console.error("session POST error:", error);
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}

export async function DELETE() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("cc-session");
  return NextResponse.json({ ok: true });
}