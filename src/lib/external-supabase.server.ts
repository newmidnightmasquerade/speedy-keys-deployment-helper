// Server-only Supabase client for the external CMS database. The .server.ts
// filename blocks any client-side import; do NOT import from a browser
// context — go through cms.functions.ts instead.
// Credentials come from the secret env vars EXTERNAL_SUPABASE_URL and
// EXTERNAL_SUPABASE_ANON_KEY (never hardcoded, never shipped to the browser).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | undefined;

function createExternalSupabase(): SupabaseClient {
  const url = process.env["EXTERNAL_SUPABASE_URL"];
  const anonKey = process.env["EXTERNAL_SUPABASE_ANON_KEY"];

  if (!url || !anonKey) {
    const missing = [
      ...(!url ? ["EXTERNAL_SUPABASE_URL"] : []),
      ...(!anonKey ? ["EXTERNAL_SUPABASE_ANON_KEY"] : []),
    ].join(", ");
    throw new Error(`Missing environment variable(s): ${missing}`);
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const externalSupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    cached ??= createExternalSupabase();
    return Reflect.get(cached, prop, receiver);
  },
});
