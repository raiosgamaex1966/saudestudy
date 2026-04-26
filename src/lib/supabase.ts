import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  try {
    return import.meta.env.VITE_SUPABASE_URL || localStorage.getItem("supabase_url") || "";
  } catch { return ""; }
}

function getSupabaseKey(): string {
  try {
    return import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem("supabase_key") || "";
  } catch { return ""; }
}

function createDummyClient(): any {
  const noop = () => Promise.resolve({ data: null, error: null });
  const chain = { select: () => chain, eq: () => chain, order: () => chain, limit: () => chain, single: () => noop(), then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb), data: [], error: null };
  return {
    from: () => ({ ...chain, insert: () => noop(), update: () => ({ ...chain, eq: () => noop() }), delete: () => ({ eq: () => noop() }) }),
    storage: { from: () => ({ upload: () => noop(), getPublicUrl: () => ({ data: { publicUrl: "" } }), remove: () => noop() }) },
    auth: { getUser: () => noop() },
  };
}

function createRealClient(): any {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return createDummyClient();
  try {
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  } catch { return createDummyClient(); }
}

// Allow recreating client when credentials change
let _instance: any = null;
export function getSupabase(): any {
  if (!_instance) _instance = createRealClient();
  return _instance;
}

/** Call this after saving new credentials to recreate the client */
export function refreshSupabase(): void {
  _instance = createRealClient();
}

// Backwards compatible export
export const supabase = getSupabase();

export function isSupabaseConfigured(): boolean {
  return !!getSupabaseUrl() && !!getSupabaseKey();
}

// Test connection by making a simple query
export async function testSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Credenciais nao configuradas" };
  }
  try {
    const client = getSupabase();
    const { error } = await client.from("subjects").select("id", { count: "exact", head: true });
    // If table doesn't exist, that's fine — connection works
    if (error && error.code !== "42P01" && error.message?.includes("does not exist") === false) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Erro de conexao" };
  }
}
