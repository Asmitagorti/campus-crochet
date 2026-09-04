import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function getServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for server database operations.");
    } else {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please add SUPABASE_SERVICE_ROLE_KEY to your environment to enable server database writes.");
    }
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}