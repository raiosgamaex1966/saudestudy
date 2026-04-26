import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocalSubjects } from "@/hooks/useLocalData";
import {
  useOfficialMaterials,
  uploadOfficialMaterial,
  deleteMaterial,
  useSupabaseUsers,
  toggleBlockUser,
  renewUserPlan,
  useSupabaseApiKeys,
  insertApiKey,
  deleteApiKey,
  getAdminStats,
  isSupabaseConfigured,
} from "@/hooks/useSupabase";
import {
  ShieldCheck, Users, FileQuestion, BookOpen, Key, Save,
  CheckCircle2, AlertCircle, Trash2, BarChart3, Activity,
  Lock, Unlock, Upload, Ban, Calendar,
  CreditCard, X, RefreshCw,
} from "lucide-react";

type Tab = "overview" | "users" | "keys" | "materials";

export default function Admin() {
  const { user } = useAuth();
  const localSubjects = useLocalSubjects();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [systemKeys, setSystemKeys] = useState({ deepinfra: "", openai: "", claude: "" });
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matTitle, setMatTitle] = useState("");
  const [matSubject, setMatSubject] = useState<number>(0);
  const [matUploading, setMatUploading] = useState(false);
  const [matMsg, setMatMsg] = useState("");

  // User management
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockUserId, setBlockUserId] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewUserId, setRenewUserId] = useState<number | null>(null);
  const [renewPlan, setRenewPlan] = useState<"monthly" | "semester" | "annual">("monthly");

  // Supabase data
  const { materials: officialMaterials, refetch: refetchMaterials } = useOfficialMaterials();
  const { users: usersList, refetch: refetchUsers } = useSupabaseUsers();
  const { keys: apiKeysList, refetch: refetchKeys } = useSupabaseApiKeys();

  // Load stats
  useEffect(() => {
    if (isSupabaseConfigured()) {
      getAdminStats().then(setStats);
    }
  }, []);

  const handleMatUpload = async () => {
    if (!matFile || !matTitle || !matSubject) {
      setMatMsg("Preencha todos os campos");
      return;
    }
    setMatUploading(true);
    setMatMsg("");
    const result = await uploadOfficialMaterial(matFile, matTitle, matSubject, user?.id || 1);
    if (result.success) {
      setMatMsg("Material enviado com sucesso!");
      setMatFile(null);
      setMatTitle("");
      refetchMaterials();
      setTimeout(() => { setUploadOpen(false); setMatMsg(""); }, 2000);
    } else {
      setMatMsg(result.error || "Erro");
    }
    setMatUploading(false);
  };

  const handleBlock = async () => {
    if (!blockUserId || !blockReason) return;
    await toggleBlockUser(blockUserId, true, blockReason);
    refetchUsers();
    setBlockOpen(false);
    setBlockReason("");
    setBlockUserId(null);
  };

  const handleRenew = async () => {
    if (!renewUserId) return;
    await renewUserPlan(renewUserId, renewPlan);
    refetchUsers();
    setRenewOpen(false);
    setRenewUserId(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (user && user.role !== "admin") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <ShieldCheck className="w-16 h-16 text-[#ef4444] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
        <p className="text-sm text-[#8a9bb8] mb-6">Esta area e exclusiva para administradores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0adbd1]" /> Gestao do Sistema
          </h1>
          <p className="text-sm text-[#8a9bb8] mt-1">Administracao da plataforma SaúdeStudy</p>
        </div>
        {!isSupabaseConfigured() && (
          <div className="px-3 py-1.5 rounded-full text-xs text-[#f59e0b]" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
            <AlertCircle className="w-3 h-3 inline mr-1" /> Supabase nao configurado
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Total Alunos", value: stats?.totalUsers ?? 0, color: "#0adbd1" },
          { icon: FileQuestion, label: "Simulados", value: stats?.totalSimulations ?? 0, color: "#0ea5e9" },
          { icon: Activity, label: "Tentativas", value: stats?.totalAttempts ?? 0, color: "#f59e0b" },
          { icon: BookOpen, label: "Materiais", value: stats?.totalMaterials ?? 0, color: "#10b981" },
          { icon: Lock, label: "Bloqueados", value: stats?.blockedUsers ?? 0, color: "#ef4444" },
          { icon: Calendar, label: "Inadimplentes", value: stats?.expiredPlans ?? 0, color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} className="metric-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="text-[10px] text-[#8a9bb8] uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 overflow-x-auto">
        {[
          { id: "overview" as Tab, label: "Visao Geral", icon: BarChart3 },
          { id: "users" as Tab, label: "Alunos", icon: Users },
          { id: "keys" as Tab, label: "Chaves API", icon: Key },
          { id: "materials" as Tab, label: "Materiais Oficiais", icon: BookOpen },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? "border-[#0adbd1] text-[#0adbd1]" : "border-transparent text-[#8a9bb8] hover:text-white"
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-[#0adbd1]" /> Chaves Mestras do Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { key: "deepinfra", label: "DeepInfra Key (Llama)" },
                { key: "openai", label: "OpenAI Key (GPT-4o)" },
                { key: "claude", label: "Claude Key (Sonnet)" },
              ].map((item) => (
                <div key={item.key}>
                  <label className="text-[10px] text-[#8a9bb8] uppercase tracking-wider mb-1 block">{item.label}</label>
                  <input type="password" value={systemKeys[item.key as keyof typeof systemKeys]}
                    onChange={(e) => setSystemKeys((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    placeholder="..."
                    className="w-full px-3 py-2.5 rounded-lg text-xs text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50 font-mono"
                    style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
                </div>
              ))}
            </div>
            <button onClick={async () => {
              let ok = true;
              if (systemKeys.deepinfra) ok = await insertApiKey("deepinfra", systemKeys.deepinfra) && ok;
              if (systemKeys.openai) ok = await insertApiKey("openai", systemKeys.openai) && ok;
              if (systemKeys.claude) ok = await insertApiKey("anthropic", systemKeys.claude) && ok;
              setSaved(ok);
              refetchKeys();
              setTimeout(() => setSaved(false), 3000);
            }} className="btn-primary px-5 py-2 rounded-xl text-xs flex items-center gap-2">
              {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Salvo!</> : <><Save className="w-3.5 h-3.5" /> Salvar Chaves</>}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel rounded-2xl p-5 cursor-pointer glow-border transition-all" onClick={() => setActiveTab("materials")}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
                  <Upload className="w-5 h-5 text-[#0adbd1]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Enviar Material Oficial</p>
                  <p className="text-[10px] text-[#8a9bb8]">Suba materiais para os alunos</p>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5 cursor-pointer glow-border transition-all" onClick={() => setActiveTab("users")}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                  <Ban className="w-5 h-5 text-[#ef4444]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Gerenciar Inadimplentes</p>
                  <p className="text-[10px] text-[#8a9bb8]">{stats?.expiredPlans ?? 0} usuarios com plano vencido</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── USERS TAB ─── */}
      {activeTab === "users" && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0adbd1]" /> Alunos Cadastrados
            </h3>
            <span className="text-xs text-[#8a9bb8]">{usersList?.length ?? 0} usuarios</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8a9bb8] border-b border-white/5">
                  <th className="text-left py-2 px-2">Nome</th>
                  <th className="text-left py-2 px-2">Email</th>
                  <th className="text-left py-2 px-2">Plano</th>
                  <th className="text-left py-2 px-2">Vencimento</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Creditos</th>
                  <th className="text-left py-2 px-2">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {(usersList ?? []).map((u) => (
                  <tr key={u.id} className={`border-b border-white/5 last:border-0 ${u.blocked ? "opacity-60" : ""}`}>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {u.blocked && <Ban className="w-3 h-3 text-[#ef4444]" />}
                        <span className="text-white">{u.name || "Sem nome"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-[#8a9bb8]">{u.email || "-"}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        u.plan === "free" ? "bg-white/5 text-[#8a9bb8]" :
                        u.plan === "monthly" ? "bg-[#0adbd1]/10 text-[#0adbd1]" :
                        u.plan === "semester" ? "bg-[#0ea5e9]/10 text-[#0ea5e9]" :
                        "bg-[#10b981]/10 text-[#10b981]"
                      }`}>
                        {u.plan === "free" ? "Gratuito" : u.plan === "monthly" ? "Mensal" : u.plan === "semester" ? "Semestral" : "Anual"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={u.isExpired ? "text-[#f59e0b]" : "text-[#8a9bb8]"}>
                        {formatDate(u.plan_expires_at)}
                        {u.isExpired && <span className="ml-1 text-[10px] font-bold">(VENCIDO)</span>}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {u.blocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#ef4444]/10 text-[#ef4444] font-medium">Bloqueado</span>
                      ) : u.isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#f59e0b]/10 text-[#f59e0b] font-medium">Inadimplente</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#10b981]/10 text-[#10b981] font-medium">Ativo</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-[#0adbd1] font-semibold">{u.credits}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        {u.blocked ? (
                          <button onClick={async () => { await toggleBlockUser(u.id, false); refetchUsers(); }}
                            className="p-1.5 rounded-lg text-[#10b981] hover:bg-[#10b981]/10 transition-all" title="Desbloquear">
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => { setBlockUserId(u.id); setBlockOpen(true); }}
                            className="p-1.5 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/10 transition-all" title="Bloquear">
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { setRenewUserId(u.id); setRenewOpen(true); }}
                          className="p-1.5 rounded-lg text-[#0adbd1] hover:bg-[#0adbd1]/10 transition-all" title="Renovar">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!usersList || usersList.length === 0) && (
                  <tr><td colSpan={7} className="py-8 text-center text-[#8a9bb8]">
                    Nenhum usuario cadastrado
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── KEYS TAB ─── */}
      {activeTab === "keys" && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-[#0adbd1]" /> Chaves API Configuradas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8a9bb8] border-b border-white/5">
                  <th className="text-left py-2 px-3">Provedor</th>
                  <th className="text-left py-2 px-3">Chave</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {(apiKeysList ?? []).map((key) => (
                  <tr key={key.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 px-3 text-white capitalize">{key.provider}</td>
                    <td className="py-3 px-3 text-[#8a9bb8] font-mono">{key.key_value?.substring(0, 10)}...</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${key.is_active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                        {key.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button onClick={async () => { await deleteApiKey(key.id); refetchKeys(); }}
                        className="p-1.5 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!apiKeysList || apiKeysList.length === 0) && (
                  <tr><td colSpan={4} className="py-8 text-center text-[#8a9bb8]">
                    {isSupabaseConfigured() ? "Nenhuma chave API configurada" : "Conecte o Supabase"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MATERIALS TAB ─── */}
      {activeTab === "materials" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Materiais Oficiais Enviados</h3>
            <button onClick={() => setUploadOpen(true)}
              className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Enviar Material Oficial
            </button>
          </div>
          <div className="glass-panel rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8a9bb8] border-b border-white/5" style={{ background: "rgba(5, 25, 50, 0.8)" }}>
                  <th className="text-left py-3 px-4">Titulo</th>
                  <th className="text-left py-3 px-4">Materia</th>
                  <th className="text-left py-3 px-4">Tamanho</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {(officialMaterials ?? []).map((mat) => (
                  <tr key={mat.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                    <td className="py-3 px-4 text-white font-medium">{mat.title}</td>
                    <td className="py-3 px-4 text-[#8a9bb8]">
                      {localSubjects.find((s) => s.id === mat.subject_id)?.name || "Geral"}
                    </td>
                    <td className="py-3 px-4 text-[#8a9bb8]">{formatSize(Number(mat.file_size))}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${mat.is_public ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                        {mat.is_public ? "Visivel" : "Oculto"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={async () => { await deleteMaterial(mat.id); refetchMaterials(); }}
                        className="p-1.5 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!officialMaterials || officialMaterials.length === 0) && (
                  <tr><td colSpan={5} className="py-12 text-center text-[#8a9bb8]">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum material oficial enviado</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {blockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}>
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                <Lock className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Bloquear Usuario</h3>
                <p className="text-[10px] text-[#8a9bb8]">O usuario perdera acesso a todas as funcionalidades</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Motivo do bloqueio *</label>
              <textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Inadimplencia - plano mensal vencido ha 15 dias" rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#ef4444]/50 resize-none"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setBlockOpen(false); setBlockReason(""); setBlockUserId(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#8a9bb8] hover:bg-white/5 transition-all" style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}>Cancelar</button>
              <button onClick={handleBlock} disabled={!blockReason}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>Bloquear</button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {renewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}>
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
                <CreditCard className="w-5 h-5 text-[#0adbd1]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Renovar Plano</h3>
                <p className="text-[10px] text-[#8a9bb8]">Defina o novo plano para o usuario</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Plano</label>
              <select value={renewPlan} onChange={(e) => setRenewPlan(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <option value="monthly">Mensal (30 dias)</option>
                <option value="semester">Semestral (180 dias)</option>
                <option value="annual">Anual (365 dias)</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRenewOpen(false); setRenewUserId(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#8a9bb8] hover:bg-white/5 transition-all" style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}>Cancelar</button>
              <button onClick={handleRenew} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">Renovar Plano</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}>
          <div className="glass-panel relative rounded-2xl p-6 w-full max-w-lg">
            <button type="button" onClick={() => { setUploadOpen(false); setMatFile(null); setMatMsg(""); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8a9bb8] hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Enviar Material Oficial</h3>
            <p className="text-xs text-[#8a9bb8] mb-5">Materiais oficiais ficam disponiveis para todos os alunos</p>

            <div className="mb-4">
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Materia *</label>
              <select value={matSubject || ""} onChange={(e) => setMatSubject(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <option value="">Selecione uma materia</option>
                {localSubjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Titulo *</label>
              <input type="text" value={matTitle} onChange={(e) => setMatTitle(e.target.value)}
                placeholder="Ex: Apostila de Enfermagem - Prova 2025"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Arquivo *</label>
              <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#0adbd1]/30 transition-all">
                {matFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-[#10b981] mx-auto" />
                    <p className="text-sm text-white">{matFile.name}</p>
                    <p className="text-xs text-[#8a9bb8]">{formatSize(matFile.size)}</p>
                    <button type="button" onClick={() => setMatFile(null)} className="text-xs text-[#ef4444] hover:underline">Remover</button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-6 h-6 text-[#8a9bb8] mx-auto mb-2" />
                    <p className="text-sm text-[#8a9bb8]">Clique para selecionar</p>
                    <p className="text-[10px] text-[#8a9bb8] mt-1">PDF, DOC, DOCX</p>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && setMatFile(e.target.files[0])} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            {matMsg && (
              <div className={`mb-3 text-xs ${matMsg.includes("sucesso") ? "text-[#10b981]" : "text-[#ef4444]"}`}>{matMsg}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setUploadOpen(false); setMatFile(null); setMatMsg(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#8a9bb8] hover:bg-white/5" style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}>Cancelar</button>
              <button onClick={handleMatUpload} disabled={!matFile || !matTitle || !matSubject || matUploading}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50">
                {matUploading ? "Enviando..." : isSupabaseConfigured() ? "Enviar & Sincronizar" : "Enviar Local"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
