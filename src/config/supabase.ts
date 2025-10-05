import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

export function createSupabaseClient(): SupabaseClient {
  const url = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars");
  }

  // v2 client
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "fastify-app" } },
  });
}
