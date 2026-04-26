import { useState, useEffect, useCallback } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { LocalSubject } from "@/lib/localAuth";
import {
  getLocalMaterials,
  saveLocalMaterial,
  deleteLocalMaterial,
  type LocalMaterial,
} from "@/lib/localMaterials";

export { isSupabaseConfigured } from "@/lib/supabase";

// ─── Subjects ───
export function useSupabaseSubjects() {
  const [subjects, setSubjects] = useState<LocalSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Try Supabase first
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await getSupabase()
            .from("subjects")
            .select("*")
            .eq("is_active", true)
            .order("id");
          if (!error && data && data.length > 0) {
            setSubjects(data as LocalSubject[]);
            setLoading(false);
            localStorage.setItem("saudestudy_subjects_v1", JSON.stringify(data));
            return;
          }
        } catch {
          // fall through
        }
      }
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem("saudestudy_subjects_v1");
        if (raw) setSubjects(JSON.parse(raw));
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  return { subjects, loading };
}

// ─── Materials — All public materials (official + user uploads) ───
export function useSupabaseMaterials(subjectId?: number) {
  const [materials, setMaterials] = useState<LocalMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // If Supabase connected → use it as PRIMARY source (shared across all users)
    if (isSupabaseConfigured()) {
      try {
        let query = getSupabase().from("materials").select("*").eq("is_public", true).order("created_at", { ascending: false });
        if (subjectId) {
          query = query.eq("subject_id", subjectId);
        }
        const { data, error } = await query;
        if (!error && data) {
          setMaterials(data as LocalMaterial[]);
          setLoading(false);
          return;
        }
      } catch { /* fall through to local */ }
    }

    // Fallback: local only (single-user mode)
    const local = await getLocalMaterials(subjectId);
    setMaterials(local);
    setLoading(false);
  }, [subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  return { materials, loading, refetch: load };
}

// ─── Official Materials — Admin uploads visible to all students ───
export function useOfficialMaterials() {
  const [materials, setMaterials] = useState<LocalMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // If Supabase connected → PRIMARY source (shared for all users)
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await getSupabase()
          .from("materials")
          .select("*")
          .eq("is_official", true)
          .order("created_at", { ascending: false });
        if (!error && data) {
          setMaterials(data as LocalMaterial[]);
          setLoading(false);
          return;
        }
      } catch { /* fall through to local */ }
    }

    // Fallback: local only (admin's browser only)
    const local = await getLocalMaterials(undefined, true);
    setMaterials(local);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { materials, loading, refetch: load };
}

// ─── Upload material (LOCAL FIRST + Supabase sync) ───
export async function uploadMaterial(
  file: File,
  title: string,
  subjectId: number,
  userId: number
): Promise<{ success: boolean; error?: string; data?: any }> {
  // 1. Always save locally first (this ALWAYS works)
  const localResult = await saveLocalMaterial(file, title, subjectId, userId, false);
  if (!localResult.success) {
    return { success: false, error: localResult.error };
  }

  // 2. Try to sync with Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `user_${userId}/${fileName}`;

      const { error: uploadError } = await getSupabase().storage
        .from("materials")
        .upload(filePath, file, { contentType: file.type });

      if (!uploadError) {
        const { data: { publicUrl } } = getSupabase().storage.from("materials").getPublicUrl(filePath);
        await getSupabase().from("materials").insert({
          title: title || file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          subject_id: subjectId,
          uploaded_by: userId,
          is_public: true,
          is_official: false,
        });
      }
    } catch {
      // Supabase sync failed but local save worked — that's fine
    }
  }

  return { success: true, data: localResult.material };
}

// ─── Upload official material (admin) (LOCAL FIRST + Supabase sync) ───
export async function uploadOfficialMaterial(
  file: File,
  title: string,
  subjectId: number,
  userId: number
): Promise<{ success: boolean; error?: string; data?: any }> {
  // 1. Always save locally first (flagged as official)
  const localResult = await saveLocalMaterial(file, title, subjectId, userId, true);
  if (!localResult.success) {
    return { success: false, error: localResult.error };
  }

  // 2. Try to sync with Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `official_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `official/${fileName}`;

      const { error: uploadError } = await getSupabase().storage
        .from("materials")
        .upload(filePath, file, { contentType: file.type });

      if (!uploadError) {
        const { data: { publicUrl } } = getSupabase().storage.from("materials").getPublicUrl(filePath);
        await getSupabase().from("materials").insert({
          title: title || file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          subject_id: subjectId,
          uploaded_by: userId,
          is_public: true,
          is_official: true,
        });
      }
    } catch {
      // Supabase sync failed but local save worked — that's fine
    }
  }

  return { success: true, data: localResult.material };
}

// ─── Delete material (LOCAL + Supabase) ───
export async function deleteMaterial(id: number): Promise<boolean> {
  // Always delete locally
  const localOk = await deleteLocalMaterial(id);

  // Also try to delete from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await getSupabase().from("materials").delete().eq("id", id);
    } catch { /* ignore */ }
  }

  return localOk;
}

// ─── Users (admin) — requires Supabase ───
export function useSupabaseUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      // Return local users as fallback
      try {
        const localUsers = JSON.parse(localStorage.getItem("saudestudy_users_v1") || "[]");
        const now = new Date();
        const enriched = localUsers.map((u: any) => ({
          ...u,
          isExpired: u.plan !== "free" && u.planExpiresAt ? new Date(u.planExpiresAt) < now : false,
        }));
        setUsers(enriched);
      } catch {
        setUsers([]);
      }
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await getSupabase()
        .from("users")
        .select("id, name, email, role, credits, plan, plan_expires_at, blocked, block_reason, created_at")
        .order("created_at", { ascending: false });
      if (!error && data) {
        const now = new Date();
        const enriched = data.map((u: any) => ({
          ...u,
          isExpired: u.plan !== "free" && u.plan_expires_at ? new Date(u.plan_expires_at) < now : false,
        }));
        setUsers(enriched);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { users, loading, refetch: load };
}

// ─── Toggle block user ───
export async function toggleBlockUser(id: number, blocked: boolean, reason?: string): Promise<boolean> {
  // Always update localStorage
  try {
    const users = JSON.parse(localStorage.getItem("saudestudy_users_v1") || "[]");
    const user = users.find((u: any) => u.id === id);
    if (user) {
      user.blocked = blocked;
      user.blockReason = blocked ? reason : null;
      localStorage.setItem("saudestudy_users_v1", JSON.stringify(users));
    }
  } catch { /* ignore */ }

  if (!isSupabaseConfigured()) return true;
  try {
    const { error } = await getSupabase()
      .from("users")
      .update({ blocked, block_reason: blocked ? reason : null })
      .eq("id", id);
    return !error;
  } catch { return true; } // Local update succeeded
}

// ─── Renew plan ───
export async function renewUserPlan(id: number, plan: string): Promise<boolean> {
  const days = plan === "monthly" ? 30 : plan === "semester" ? 180 : 365;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  // Always update localStorage
  try {
    const users = JSON.parse(localStorage.getItem("saudestudy_users_v1") || "[]");
    const user = users.find((u: any) => u.id === id);
    if (user) {
      user.plan = plan;
      user.planExpiresAt = expiresAt.toISOString();
      user.blocked = false;
      user.blockReason = null;
      localStorage.setItem("saudestudy_users_v1", JSON.stringify(users));
    }
  } catch { /* ignore */ }

  if (!isSupabaseConfigured()) return true;
  try {
    const { error } = await getSupabase()
      .from("users")
      .update({ plan, plan_expires_at: expiresAt.toISOString(), blocked: false })
      .eq("id", id);
    return !error;
  } catch { return true; }
}

// ─── API Keys ───
export function useSupabaseApiKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Return local API keys as fallback
    try {
      const localKeys = JSON.parse(localStorage.getItem("api_keys") || "{}");
      const formatted = Object.entries(localKeys)
        .filter(([_, v]) => v)
        .map(([k, v], i) => ({
          id: i + 1,
          provider: k,
          key_value: v as string,
          is_active: true,
          created_at: new Date().toISOString(),
        }));
      if (formatted.length > 0) {
        setKeys(formatted);
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await getSupabase().from("api_keys").select("*").order("created_at", { ascending: false });
      if (!error && data) setKeys(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { keys, loading, refetch: load };
}

// ─── Insert API Key ───
export async function insertApiKey(provider: string, keyValue: string): Promise<boolean> {
  // Always save to localStorage
  try {
    const keys = JSON.parse(localStorage.getItem("api_keys") || "{}");
    keys[provider] = keyValue;
    localStorage.setItem("api_keys", JSON.stringify(keys));
  } catch { /* ignore */ }

  if (!isSupabaseConfigured()) return true;
  try {
    await getSupabase().from("api_keys").update({ is_active: false }).eq("provider", provider);
    const { error } = await getSupabase().from("api_keys").insert({ provider, key_value: keyValue, is_active: true });
    return !error;
  } catch { return true; }
}

// ─── Delete API Key ───
export async function deleteApiKey(id: number): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Remove from localStorage
    try {
      const keys = JSON.parse(localStorage.getItem("api_keys") || "{}");
      const keyEntry = Object.entries(keys).find(([_, v], i) => i + 1 === id);
      if (keyEntry) {
        delete keys[keyEntry[0]];
        localStorage.setItem("api_keys", JSON.stringify(keys));
      }
    } catch { /* ignore */ }
    return true;
  }
  try {
    const { error } = await getSupabase().from("api_keys").delete().eq("id", id);
    return !error;
  } catch { return false; }
}

// ─── Admin Stats ───
export async function getAdminStats(): Promise<any> {
  // Calculate from localStorage
  const localUsers = JSON.parse(localStorage.getItem("saudestudy_users_v1") || "[]");
  const localMaterials = await getLocalMaterials();
  const now = new Date();

  const baseStats = {
    totalUsers: localUsers.length,
    totalSimulations: 0, // Will be tracked when we add simulations
    totalAttempts: 0,
    totalMaterials: localMaterials.length,
    blockedUsers: localUsers.filter((u: any) => u.blocked).length,
    expiredPlans: localUsers.filter((u: any) =>
      u.plan !== "free" && u.planExpiresAt && new Date(u.planExpiresAt) < now
    ).length,
  };

  if (!isSupabaseConfigured()) return baseStats;

  try {
    const [users, sims, atts, mats, blocked] = await Promise.all([
      getSupabase().from("users").select("*", { count: "exact", head: true }),
      getSupabase().from("simulations").select("*", { count: "exact", head: true }),
      getSupabase().from("attempts").select("*", { count: "exact", head: true }),
      getSupabase().from("materials").select("*", { count: "exact", head: true }),
      getSupabase().from("users").select("*", { count: "exact", head: true }).eq("blocked", true),
    ]);

    return {
      totalUsers: users.count ?? baseStats.totalUsers,
      totalSimulations: sims.count ?? 0,
      totalAttempts: atts.count ?? 0,
      totalMaterials: mats.count ?? baseStats.totalMaterials,
      blockedUsers: blocked.count ?? baseStats.blockedUsers,
      expiredPlans: baseStats.expiredPlans,
    };
  } catch { return baseStats; }
}

// ─── Save API keys to Supabase from Configuracoes ───
export async function saveConfigApiKeys(keys: { deepinfra?: string; openai?: string; claude?: string }): Promise<boolean> {
  // Always save to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem("api_keys") || "{}");
    if (keys.deepinfra) existing.deepinfra = keys.deepinfra;
    if (keys.openai) existing.openai = keys.openai;
    if (keys.claude) existing.claude = keys.claude;
    localStorage.setItem("api_keys", JSON.stringify(existing));
  } catch { /* ignore */ }

  if (!isSupabaseConfigured()) return true;
  try {
    const promises = [];
    if (keys.deepinfra) promises.push(insertApiKey("deepinfra", keys.deepinfra));
    if (keys.openai) promises.push(insertApiKey("openai", keys.openai));
    if (keys.claude) promises.push(insertApiKey("anthropic", keys.claude));
    await Promise.all(promises);
    return true;
  } catch { return true; }
}
