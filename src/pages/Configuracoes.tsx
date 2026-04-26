import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, refreshSupabase, testSupabaseConnection } from "@/lib/supabase";
import { saveConfigApiKeys } from "@/hooks/useSupabase";
import {
  Key, Shield, Save, CheckCircle2, ExternalLink, Database,
  Loader2, Wifi, Brain, Zap, Info, ToggleLeft, ToggleRight,
} from "lucide-react";

export default function Configuracoes() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // ─── Supabase State (admin only) ───
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [connStatus, setConnStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [connError, setConnError] = useState("");

  // ─── LLM Keys State (everyone) ───
  const [apiKeys, setApiKeys] = useState({ openai: "", anthropic: "", gemini: "", deepinfra: "" });
  const [apiSaved, setApiSaved] = useState(false);
  const [useOwnKeys, setUseOwnKeys] = useState(false);

  // Load on mount
  useEffect(() => {
    // Load Supabase credentials
    const url = localStorage.getItem("supabase_url") || "";
    const key = localStorage.getItem("supabase_key") || "";
    if (url) setSupabaseUrl(url);
    if (key) setSupabaseKey(key);
    if (url && key) setConnStatus("ok");

    // Load LLM keys
    try {
      const saved = JSON.parse(localStorage.getItem("api_keys") || "{}");
      setApiKeys({
        openai: saved.openai || "",
        anthropic: saved.anthropic || "",
        gemini: saved.gemini || "",
        deepinfra: saved.deepinfra || "",
      });
    } catch { /* ignore */ }

    // Load preference: usar chave propria ou do admin
    const ownPref = localStorage.getItem("saudestudy_use_own_llm_keys");
    setUseOwnKeys(ownPref === "true");
  }, []);

  // ─── Supabase Handlers (admin) ───
  const handleSaveSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setConnStatus("error");
      setConnError("Preencha a URL e a chave do Supabase");
      return;
    }
    localStorage.setItem("supabase_url", supabaseUrl.trim());
    localStorage.setItem("supabase_key", supabaseKey.trim());
    refreshSupabase();
    setConnStatus("testing");
    const result = await testSupabaseConnection();
    if (result.ok) {
      setConnStatus("ok");
      setConnError("");
    } else {
      setConnStatus("error");
      setConnError(result.error || "Falha na conexao");
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("supabase_url");
    localStorage.removeItem("supabase_key");
    setSupabaseUrl("");
    setSupabaseKey("");
    refreshSupabase();
    setConnStatus("idle");
    setConnError("");
  };

  // ─── LLM Keys Handlers (everyone) ───
  const handleToggleKeys = (useOwn: boolean) => {
    setUseOwnKeys(useOwn);
    localStorage.setItem("saudestudy_use_own_llm_keys", useOwn ? "true" : "false");
  };

  const handleSaveApiKeys = async () => {
    localStorage.setItem("api_keys", JSON.stringify(apiKeys));
    if (isSupabaseConfigured() && connStatus === "ok" && isAdmin) {
      await saveConfigApiKeys({
        deepinfra: apiKeys.deepinfra,
        openai: apiKeys.openai,
        claude: apiKeys.anthropic,
      });
    }
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 3000);
  };

  // ─── Render helpers ───
  const statusColor = {
    idle: "border-[#8a9bb8]/30",
    testing: "border-[#f59e0b]/30",
    ok: "border-[#10b981]/30",
    error: "border-[#ef4444]/30",
  };
  const statusDot = {
    idle: "bg-[#8a9bb8]",
    testing: "bg-[#f59e0b]",
    ok: "bg-[#10b981]",
    error: "bg-[#ef4444]",
  };
  const statusText = {
    idle: "Nao conectado. Adicione as credenciais acima.",
    testing: "Testando conexao com o Supabase...",
    ok: "Supabase conectado! Upload e sync ativos.",
    error: connError || "Falha na conexao. Verifique as credenciais.",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuracoes</h1>
        <p className="text-sm text-[#8a9bb8] mt-1">
          {isAdmin
            ? "Configure seu Supabase e chaves de IA"
            : "Configure as chaves de IA para seus simulados personalizados"}
        </p>
      </div>

      {/* ═══════ SUPABASE CONFIG — ADMIN ONLY ═══════ */}
      {isAdmin && (
        <>
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(61, 200, 120, 0.1)" }}>
                <Database className="w-5 h-5 text-[#3dc878]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Configuracao do Supabase</h2>
                <p className="text-[10px] text-[#8a9bb8]">Apenas administradores podem configurar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8a9bb8] mb-1.5 block flex items-center gap-1">
                  Supabase Project URL
                  <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer"
                    className="text-[#0adbd1] hover:underline inline-flex items-center">
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input type="text" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://seu-projeto.supabase.co"
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50 font-mono"
                  style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
              </div>
              <div>
                <label className="text-xs text-[#8a9bb8] mb-1.5 block">Supabase Anon Key</label>
                <input type="password" value={supabaseKey} onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50 font-mono"
                  style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(16, 185, 129, 0.05)" }}>
              <p className="text-[10px] text-[#8a9bb8]">
                <Shield className="w-3 h-3 inline mr-1 text-[#10b981]" />
                As credenciais ficam salvas apenas neste navegador. Va em Settings {'>'} API no seu projeto Supabase para obter estas informacoes.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleSaveSupabase}
                disabled={connStatus === "testing"}
                className="flex-1 btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {connStatus === "testing" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Testando...</>
                ) : connStatus === "ok" ? (
                  <><CheckCircle2 className="w-4 h-4" /> Conectado!</>
                ) : (
                  <><Save className="w-4 h-4" /> Conectar ao Supabase</>
                )}
              </button>
              {connStatus === "ok" && (
                <button onClick={handleDisconnect}
                  className="px-4 py-3 rounded-xl text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                  style={{ border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                  Desconectar
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className={`glass-panel rounded-2xl p-4 flex items-center gap-3 ${statusColor[connStatus]}`}>
            <div className={`w-3 h-3 rounded-full ${statusDot[connStatus]} ${connStatus === "testing" ? "animate-pulse" : ""}`} />
            <p className={`text-sm ${connStatus === "ok" ? "text-[#10b981]" : connStatus === "error" ? "text-[#ef4444]" : "text-[#8a9bb8]"}`}>
              {statusText[connStatus]}
            </p>
          </div>

          {/* What to create in Supabase */}
          {connStatus === "ok" && (
            <div className="glass-panel rounded-2xl p-4 border border-[#0adbd1]/20" style={{ background: "rgba(10, 219, 209, 0.03)" }}>
              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-[#0adbd1] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#0adbd1] mb-1">Conexao ativa!</p>
                  <p className="text-[10px] text-[#8a9bb8] mb-2">Agora crie no seu Supabase:</p>
                  <ol className="text-[10px] text-[#8a9bb8] space-y-1 list-decimal list-inside">
                    <li><strong>Storage Bucket:</strong> Crie um bucket chamado <code className="text-[#0adbd1]">materials</code></li>
                    <li><strong>SQL Tables:</strong> Execute o SQL que esta em <code className="text-[#0adbd1]">saudestudy_supabase.sql</code></li>
                    <li><strong>RLS Policies:</strong> Ative as politicas de Row Level Security incluidas no SQL</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-white/10 my-6" />
        </>
      )}

      {/* ═══════ LLM KEYS — EVERYONE (ADMIN + STUDENTS) ═══════ */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(14, 165, 233, 0.1)" }}>
            <Brain className="w-5 h-5 text-[#0ea5e9]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Chaves de API de IA</h2>
            <p className="text-[10px] text-[#8a9bb8]">Configure seus modelos de inteligencia artificial</p>
          </div>
        </div>

        {/* Toggle: usar do admin vs propria */}
        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(10, 219, 209, 0.05)", border: "1px solid rgba(10, 219, 209, 0.15)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0adbd1]" />
              <span className="text-sm text-white font-medium">Fonte das chaves de IA</span>
            </div>
            <button
              onClick={() => handleToggleKeys(!useOwnKeys)}
              className="flex items-center gap-2 transition-all"
            >
              {useOwnKeys ? (
                <ToggleRight className="w-8 h-8 text-[#0adbd1]" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-[#8a9bb8]" />
              )}
              <span className={`text-xs ${useOwnKeys ? "text-[#0adbd1]" : "text-[#8a9bb8]"}`}>
                {useOwnKeys ? "Minhas chaves" : "Chave do admin"}
              </span>
            </button>
          </div>
          <p className="text-[10px] text-[#8a9bb8]">
            {useOwnKeys
              ? "Voce esta usando suas proprias chaves de API. Configure abaixo."
              : "Voce esta usando as chaves do administrador (inclusas no seu plano)."}
          </p>
        </div>

        {/* Admin LLM keys input — show when admin is logged in OR when user chose "use own keys" */}
        {(isAdmin || useOwnKeys) && (
          <>
            <div className="space-y-4">
              {[
                { key: "openai", label: "OpenAI API Key (GPT-4o)", link: "https://platform.openai.com/api-keys" },
                { key: "anthropic", label: "Anthropic Key (Claude 3.5)", link: "https://console.anthropic.com/settings/keys" },
                { key: "gemini", label: "Google Gemini Key", link: "https://aistudio.google.com/app/apikey" },
                { key: "deepinfra", label: "DeepInfra Key", link: "https://deepinfra.com/dash/api_keys" },
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-[#8a9bb8]">{item.label}</label>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#0adbd1] hover:underline flex items-center gap-1">
                      Obter chave <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input type="password"
                    value={apiKeys[item.key as keyof typeof apiKeys]}
                    onChange={(e) => setApiKeys((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    placeholder={isAdmin && !useOwnKeys ? "Chave do admin (opcional)" : "Sua chave API..."}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50 font-mono"
                    style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
                </div>
              ))}
            </div>

            <button onClick={handleSaveApiKeys}
              className="w-full mt-4 btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              {apiSaved ? <><CheckCircle2 className="w-4 h-4" /> Chaves Salvas!</> : <><Save className="w-4 h-4" /> Salvar Chaves</>}
            </button>
          </>
        )}

        {/* Student using admin keys — show info */}
        {!isAdmin && !useOwnKeys && (
          <div className="p-4 rounded-xl text-center" style={{ background: "rgba(10, 219, 209, 0.05)", border: "1px solid rgba(10, 219, 209, 0.15)" }}>
            <Zap className="w-8 h-8 text-[#0adbd1] mx-auto mb-2" />
            <p className="text-sm text-white font-medium mb-1">Usando chave do administrador</p>
            <p className="text-xs text-[#8a9bb8]">
              As simulacoes sao geradas usando a inteligencia artificial do SaúdeStudy, inclusa no seu plano.
            </p>
            <button
              onClick={() => handleToggleKeys(true)}
              className="mt-3 text-xs text-[#0adbd1] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Key className="w-3 h-3" />
              Quero usar minha propria chave
            </button>
          </div>
        )}

        {/* Info box about monetization */}
        <div className="mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.1)" }}>
          <Info className="w-4 h-4 text-[#f59e0b] flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#8a9bb8]">
            <strong className="text-[#f59e0b]">Dica:</strong> Se nao tiver chaves proprias, pode usar as do SaúdeStudy (inclusas no plano).
            Alunos com chaves proprias podem ter acesso a modelos mais avancados no futuro.
          </p>
        </div>
      </div>
    </div>
  );
}
