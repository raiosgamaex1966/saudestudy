import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { loginLocal, registerLocal, logoutLocal } from "@/lib/localAuth";
import {
  Zap,
  ShieldCheck,
  UserCheck,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  ArrowLeft,
} from "lucide-react";

export default function Login({ onBack }: { onBack?: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");

  // If already logged in locally, refresh the page to load the app
  useEffect(() => {
    if (isAuthenticated && !user) {
      window.location.reload();
    }
  }, [isAuthenticated, user]);

  const makeAdminMutation = trpc.auth.makeMeAdmin.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      setAdminMsg("Você agora é Administrador! Recarregando...");
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (err) => {
      // If server is down, try local approach
      try {
        const session = localStorage.getItem("saudestudy_session");
        if (session) {
          const parsed = JSON.parse(session);
          parsed.role = "admin";
          localStorage.setItem("saudestudy_session", JSON.stringify(parsed));
          // Also update in users list
          const users = JSON.parse(localStorage.getItem("saudestudy_users") || "[]");
          const userIdx = users.findIndex((u: any) => u.id === parsed.id);
          if (userIdx !== -1) {
            users[userIdx].role = "admin";
            localStorage.setItem("saudestudy_users", JSON.stringify(users));
          }
          setAdminMsg("Você agora é Administrador! Recarregando...");
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch {
        setAdminMsg(err.message || "Erro ao tornar admin");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        // Try local auth first (always works in static deploy)
        const result = await loginLocal(email, password);
        if (result.success) {
          window.location.reload();
        } else {
          setError(result.error || "Email ou senha incorretos");
        }
      } else {
        const result = await registerLocal(name, email, password);
        if (result.success) {
          window.location.reload();
        } else {
          setError(result.error || "Erro ao criar conta");
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Already authenticated screen
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#020b15" }}>
        <div className="glass-panel rounded-2xl p-8 w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)", boxShadow: "0 0 30px rgba(10, 219, 209, 0.3)" }}>
              <Zap className="w-8 h-8 text-[#020b15]" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">SaúdeStudy</h1>
            <p className="text-sm text-[#8a9bb8] mt-1">IA para Concursos na Área da Saúde</p>
          </div>

          <div className="p-4 rounded-xl text-left space-y-2" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <p className="text-xs text-[#8a9bb8]">Usuário logado</p>
            <p className="text-sm text-white font-medium">{user.name || "Sem nome"}</p>
            <p className="text-xs text-[#8a9bb8]">{user.email || ""}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-[10px] text-[#8a9bb8]">Função:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-white/5 text-[#8a9bb8]"}`}>
                {user.role === "admin" ? "ADMINISTRADOR" : "ALUNO"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {user.role !== "admin" && (
              <button
                onClick={() => makeAdminMutation.mutate()}
                disabled={makeAdminMutation.isPending}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#020b15" }}
              >
                <ShieldCheck className="w-4 h-4" />
                {makeAdminMutation.isPending ? "Processando..." : "Tornar-me Administrador"}
              </button>
            )}
            {adminMsg && <p className={`text-xs ${adminMsg.includes("agora") ? "text-[#10b981]" : "text-[#ef4444]"}`}>{adminMsg}</p>}
            <a href="/" className="block w-full py-3 rounded-xl text-sm font-semibold btn-primary flex items-center justify-center gap-2">
              <UserCheck className="w-4 h-4" /> Ir para o Dashboard
            </a>
            <button onClick={logoutLocal} className="w-full py-2.5 rounded-xl text-xs text-[#8a9bb8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all" style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login / Register form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#020b15" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(10, 219, 209, 0.08), transparent 70%)" }} />

      <div className="glass-panel rounded-2xl p-8 w-full max-w-md relative space-y-6">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-1 text-[10px] text-[#8a9bb8] hover:text-[#0adbd1] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar
          </button>
        )}

        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)", boxShadow: "0 0 40px rgba(10, 219, 209, 0.3)" }}>
            <Zap className="w-8 h-8 text-[#020b15]" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">SaúdeStudy</h1>
          <p className="text-sm text-[#8a9bb8] mt-1">IA para Concursos na Área da Saúde</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
          <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === "login" ? "bg-[#0adbd1]/20 text-[#0adbd1]" : "text-[#8a9bb8] hover:text-white"}`}>
            <LogIn className="w-3.5 h-3.5 inline mr-1" /> Entrar
          </button>
          <button onClick={() => { setMode("register"); setError(""); }} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === "register" ? "bg-[#0adbd1]/20 text-[#0adbd1]" : "text-[#8a9bb8] hover:text-white"}`}>
            <UserPlus className="w-3.5 h-3.5 inline mr-1" /> Criar Conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Nome completo</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9bb8]" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                  style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-[#8a9bb8] mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9bb8]" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8a9bb8] mb-1.5 block">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9bb8]" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"} required
                minLength={mode === "register" ? 6 : undefined}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
            </div>
          </div>

          {error && <div className="p-3 rounded-xl text-xs text-[#ef4444]" style={{ background: "rgba(239, 68, 68, 0.1)" }}>{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full btn-primary py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? "Processando..." : mode === "login" ? (<><LogIn className="w-4 h-4" /> Entrar</>) : (<><UserPlus className="w-4 h-4" /> Criar Conta</>)}
          </button>
        </form>

        <p className="text-[10px] text-[#8a9bb8] text-center">Ao entrar, você concorda com os termos de uso da plataforma.</p>
      </div>
    </div>
  );
}
