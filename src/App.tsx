import { Routes, Route } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { initSubjects } from "@/lib/localAuth";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Materiais from "@/pages/Materiais";
import Simulados from "@/pages/Simulados";
import Planos from "@/pages/Planos";
import Configuracoes from "@/pages/Configuracoes";
import Admin from "@/pages/Admin";
import Fundador from "@/pages/Fundador";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Initialize subjects in localStorage on app start
  useEffect(() => {
    initSubjects();
  }, []);

  // Not authenticated - show landing page first, then login on CTA click
  if (!isAuthenticated) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <Landing onLogin={() => setShowLogin(true)} />;
  }

  // Authenticated - show full app
  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper><Dashboard /></LayoutWrapper>} />
      <Route path="/materiais" element={<LayoutWrapper><Materiais /></LayoutWrapper>} />
      <Route path="/simulados" element={<LayoutWrapper><Simulados /></LayoutWrapper>} />
      <Route path="/planos" element={<LayoutWrapper><Planos /></LayoutWrapper>} />
      <Route path="/configuracoes" element={<LayoutWrapper><Configuracoes /></LayoutWrapper>} />
      <Route path="/admin" element={<LayoutWrapper><Admin /></LayoutWrapper>} />
      <Route path="/fundador" element={<LayoutWrapper><Fundador /></LayoutWrapper>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
