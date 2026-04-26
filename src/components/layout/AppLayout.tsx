import { useLocation, Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { logoutLocal } from "@/lib/localAuth";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  CreditCard,
  UserCircle,
  Award,
  Lock,
  Calendar,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Base de Conhecimento", path: "/materiais" },
  { icon: FileQuestion, label: "Criar Simulados", path: "/simulados" },
  { icon: CreditCard, label: "Planos e Créditos", path: "/planos" },
  { icon: Award, label: "Sobre o Idealizador", path: "/fundador" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const adminItem = { icon: ShieldCheck, label: "Painel Admin", path: "/admin" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isAuthenticated, isBlocked, isExpired, statusMessage } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: creditData } = trpc.credit.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#020b15" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "rgba(2, 11, 21, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/5 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)" }}>
            <Zap className="w-5 h-5 text-[#020b15]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gradient">SaúdeStudy</span>
              <span className="text-[10px] text-[#8a9bb8]">IA para Concursos</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className={`mb-4 ${collapsed ? "text-center" : "px-3"}`}>
            {!collapsed && (
              <span className="text-[10px] uppercase tracking-wider text-[#8a9bb8] font-semibold">
                Menu Principal
              </span>
            )}
          </div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className={`mt-6 mb-2 ${collapsed ? "text-center" : "px-3"}`}>
                {!collapsed && (
                  <span className="text-[10px] uppercase tracking-wider text-[#8a9bb8] font-semibold">
                    Administração
                  </span>
                )}
              </div>
              <Link
                to={adminItem.path}
                className={`sidebar-item ${location.pathname === adminItem.path ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? adminItem.label : undefined}
              >
                <adminItem.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{adminItem.label}</span>}
              </Link>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          {!collapsed && creditData && (
            <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(10, 219, 209, 0.05)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-[#0adbd1]" />
                <span className="text-xs text-[#8a9bb8]">Créditos</span>
              </div>
              <span className="text-lg font-bold text-[#0adbd1]">{creditData.credits}</span>
              <span className="text-[10px] text-[#8a9bb8] ml-1">disponíveis</span>
            </div>
          )}

          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#0adbd1] to-[#0ea5e9]">
              <UserCircle className="w-5 h-5 text-[#020b15]" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{user?.name || "Usuário"}</p>
                <p className="text-[10px] text-[#8a9bb8] truncate">{user?.email || ""}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logoutLocal}
                className="p-1.5 rounded-lg text-[#8a9bb8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center bg-[#0adbd1] text-[#020b15] hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/5" style={{ background: "rgba(2, 11, 21, 0.8)", backdropFilter: "blur(10px)" }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-[#8a9bb8] hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-gradient">SaúdeStudy</span>
          <div className="w-8" />
        </header>

        {/* Status Banner */}
        {statusMessage && (
          <div
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
            style={{
              background: isBlocked ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
              borderBottom: isBlocked ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(245, 158, 11, 0.2)",
            }}
          >
            {isBlocked ? (
              <Lock className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
            ) : (
              <Calendar className="w-4 h-4 text-[#f59e0b] flex-shrink-0" />
            )}
            <p className={`text-xs flex-1 ${isBlocked ? "text-[#ef4444]" : "text-[#f59e0b]"}`}>
              {statusMessage}
            </p>
            {isExpired && (
              <Link
                to="/planos"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
                style={{
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                }}
              >
                Renovar Plano
              </Link>
            )}
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
