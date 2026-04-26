import bcrypt from "bcryptjs";
import { isSupabaseConfigured, getSupabase } from "./supabase";

export type LocalUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  password: string;
  credits: number;
  plan: "free" | "monthly" | "semester" | "annual";
  planExpiresAt: string | null;
  blocked: boolean;
  blockReason: string | null;
  createdAt: string;
};

export type LocalSubject = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  is_active: boolean;
};

export type SessionUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  credits: number;
  plan: string;
  blocked: boolean;
  blockReason: string | null;
};

const STORAGE_KEY = "saudestudy_users_v1";
const SESSION_KEY = "saudestudy_session_v1";

function getUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getNextId(): number {
  const users = getUsers();
  if (users.length === 0) return 1;
  return Math.max(...users.map((u) => u.id)) + 1;
}

const SUBJECTS_KEY = "saudestudy_subjects_v1";

function getSubjectsLocal(): LocalSubject[] {
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSubjectsLocal(subjects: LocalSubject[]) {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
}

export function initSubjects() {
  const existing = getSubjectsLocal();
  if (existing.length > 0) return; // already seeded

  const subjects: LocalSubject[] = [
    { id: 1, name: "Técnico em Radiologia", slug: "tecnico-radiologia", description: "Procedimentos radiológicos, proteção radiológica, anatomia para radiologia e legislação", icon: "scan", category: "Técnico", is_active: true },
    { id: 2, name: "Técnico em Enfermagem", slug: "tecnico-enfermagem", description: "Cuidados de enfermagem, administração de medicamentos, biossegurança e ética profissional", icon: "heart-pulse", category: "Técnico", is_active: true },
    { id: 3, name: "Enfermeiro", slug: "enfermeiro", description: "Processo de enfermagem, gestão em saúde, pesquisa e assistência de alta complexidade", icon: "stethoscope", category: "Superior", is_active: true },
    { id: 4, name: "Sistema Único de Saúde (SUS)", slug: "sus", description: "Legislação do SUS, princípios, organização e políticas de saúde pública", icon: "shield-plus", category: "Legislação", is_active: true },
    { id: 5, name: "Raciocínio Lógico Matemático", slug: "raciocinio-logico", description: "Lógica proposicional, argumentação, sequências, análise combinatória e probabilidade", icon: "brain", category: "Geral", is_active: true },
    { id: 6, name: "Matemática", slug: "matematica", description: "Aritmética, álgebra, geometria, trigonometria, estatística e análise matemática", icon: "calculator", category: "Geral", is_active: true },
    { id: 7, name: "Redação", slug: "redacao", description: "Técnicas de redação, coesão, coerência, tipologia textual e normas cultas", icon: "pen-tool", category: "Geral", is_active: true },
    { id: 8, name: "Português", slug: "portugues", description: "Gramática, interpretação de texto, literatura, ortografia e semântica", icon: "book-open", category: "Geral", is_active: true },
  ];
  saveSubjectsLocal(subjects);
}

export function getSubjects(): LocalSubject[] {
  initSubjects();
  return getSubjectsLocal();
}

export function initAdminUser() {
  const users = getUsers();
  const adminExists = users.some(
    (u) => u.email === "robsoncordeiro1966@gmail.com"
  );

  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync("Binho2020@#$", 10);
    const adminUser: LocalUser = {
      id: getNextId(),
      name: "Robson Cordeiro dos Santos",
      email: "robsoncordeiro1966@gmail.com",
      role: "admin",
      password: hashedPassword,
      credits: 9999,
      plan: "annual",
      planExpiresAt: null,
      blocked: false,
      blockReason: null,
      createdAt: new Date().toISOString(),
    };
    users.push(adminUser);
    saveUsers(users);
  }
}

export async function registerLocal(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();

  if (users.some((u) => u.email === email)) {
    return { success: false, error: "Email já cadastrado" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: LocalUser = {
    id: getNextId(),
    name,
    email,
    role: "user",
    password: hashedPassword,
    credits: 5,
    plan: "free",
    planExpiresAt: null,
    blocked: false,
    blockReason: null,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  setSession(newUser);

  return { success: true };
}

export async function loginLocal(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  initAdminUser();

  // ─── Try Supabase first if connected ───
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (!error && data) {
        // Supabase stores password in plain text (from your insert)
        if (data.password === password) {
          // Sync to localStorage
          const localUsers = getUsers();
          const existingIdx = localUsers.findIndex((u) => u.email === email);
          const syncedUser: LocalUser = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            password: await bcrypt.hash(password, 10),
            credits: data.credits ?? 5,
            plan: data.plan ?? "free",
            planExpiresAt: data.planExpiresAt ?? null,
            blocked: data.blocked ?? false,
            blockReason: data.blockReason ?? null,
            createdAt: data.createdAt ?? new Date().toISOString(),
          };
          if (existingIdx >= 0) {
            localUsers[existingIdx] = syncedUser;
          } else {
            localUsers.push(syncedUser);
          }
          saveUsers(localUsers);
          setSession(syncedUser);
          return { success: true };
        } else {
          return { success: false, error: "Email ou senha incorretos" };
        }
      }
    } catch {
      // Supabase error — fall through to local
    }
  }

  // ─── Fallback: localStorage ───
  const users = getUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return { success: false, error: "Email ou senha incorretos" };
  }

  if (user.blocked) {
    return {
      success: false,
      error: user.blockReason || "Conta bloqueada. Entre em contato com o suporte.",
    };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { success: false, error: "Email ou senha incorretos" };
  }

  setSession(user);
  return { success: true };
}

function setSession(user: LocalUser) {
  const session: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: user.credits,
    plan: user.plan,
    blocked: user.blocked,
    blockReason: user.blockReason,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export function getAllUsers(): LocalUser[] {
  initAdminUser();
  return getUsers();
}

export function blockUserLocal(id: number, reason: string) {
  const users = getUsers();
  const user = users.find((u) => u.id === id);
  if (user) {
    user.blocked = true;
    user.blockReason = reason;
    saveUsers(users);
    const session = getSession();
    if (session && session.id === id) {
      session.blocked = true;
      session.blockReason = reason;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }
}

export function unblockUserLocal(id: number) {
  const users = getUsers();
  const user = users.find((u) => u.id === id);
  if (user) {
    user.blocked = false;
    user.blockReason = null;
    saveUsers(users);
    const session = getSession();
    if (session && session.id === id) {
      session.blocked = false;
      session.blockReason = null;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }
}

export function updateUserLocal(id: number, updates: Partial<LocalUser>) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
  }
}

export function logoutLocal() {
  clearSession();
  window.location.reload();
}
