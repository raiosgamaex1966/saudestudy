import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import ParticleBackground from "@/components/effects/ParticleBackground";
import {
  Zap, BookOpen, Brain, FileText, BarChart3, ShieldCheck,
  Award, Users, Clock, Star, ChevronRight, Check, Heart,
  GraduationCap, Lightbulb, Target, TrendingUp, Flame,
  Monitor, Smartphone, Globe, Upload, Camera, Pencil,
} from "lucide-react";

// ─── Founder Photo Helpers ───
const FOUNDER_PHOTO_KEY = "saudestudy_founder_photo_v1";
const FOUNDER_DEFAULT_PHOTO = "/founder-robson.jpg";

function getFounderPhoto(): string | null {
  try { return localStorage.getItem(FOUNDER_PHOTO_KEY); } catch { return null; }
}

function saveFounderPhoto(base64: string) {
  try { localStorage.setItem(FOUNDER_PHOTO_KEY, base64); } catch { /* ignore */ }
}

function useFounderPhoto() {
  const [photo, setPhoto] = useState<string | null>(getFounderPhoto);

  const updatePhoto = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        saveFounderPhoto(result);
        setPhoto(result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Use uploaded photo, or default asset, or null
  const displayPhoto = photo || FOUNDER_DEFAULT_PHOTO;

  return { photo, displayPhoto, updatePhoto };
}

function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("saudestudy_session_v1") || "null");
      setIsAdmin(session?.role === "admin");
    } catch { setIsAdmin(false); }
  }, []);
  return isAdmin;
}

const subjects = [
  { name: "Técnico em Radiologia", icon: "scan", desc: "Procedimentos radiológicos e proteção" },
  { name: "Técnico em Enfermagem", icon: "heart-pulse", desc: "Cuidados e administração de medicamentos" },
  { name: "Enfermeiro", icon: "stethoscope", desc: "Processo de enfermagem e gestão" },
  { name: "Sistema Único de Saúde (SUS)", icon: "shield-plus", desc: "Legislação e políticas de saúde" },
  { name: "Raciocínio Lógico Matemático", icon: "brain", desc: "Lógica, sequências e probabilidade" },
  { name: "Matemática", icon: "calculator", desc: "Álgebra, geometria e estatística" },
  { name: "Redação", icon: "pen-tool", desc: "Técnicas e normas cultas" },
  { name: "Português", icon: "book-open", desc: "Gramática e interpretação" },
];

const features = [
  {
    icon: Brain,
    title: "Simulados com IA",
    desc: "Gere questões personalizadas automaticamente a partir dos seus materiais de estudo usando inteligência artificial.",
  },
  {
    icon: FileText,
    title: "Upload de Materiais",
    desc: "Envie PDFs, DOCs e DOCXs da sua matéria. A IA analisa e cria provas baseadas no seu conteúdo.",
  },
  {
    icon: BarChart3,
    title: "Acompanhamento de Desempenho",
    desc: "Visualize sua evolução com gráficos de acertos, erros e taxa de aprovação por matéria.",
  },
  {
    icon: BookOpen,
    title: "Base de Conhecimento",
    desc: "Acesse materiais oficiais organizados por disciplina, enviados pela nossa equipe especializada.",
  },
  {
    icon: ShieldCheck,
    title: "Correção Instantânea",
    desc: "Receba feedback imediato com explicações detalhadas sobre cada questão respondida.",
  },
  {
    icon: Award,
    title: "Sequência de Estudos",
    desc: "Mantenha uma rotina de estudos com acompanhamento de sequência diária e metas.",
  },
];

const plans = [
  {
    name: "Mensal",
    price: "R$ 49,00",
    period: "/mês",
    credits: 10,
    features: ["10 créditos por mês", "500MB de materiais", "Simulados ilimitados", "Exportação PDF", "Suporte por email"],
    popular: false,
  },
  {
    name: "Semestral",
    price: "R$ 265,00",
    period: "/semestre",
    credits: 60,
    features: ["60 créditos por semestre", "3GB de materiais", "Simulados ilimitados", "Exportação PDF", "Suporte prioritário", "Economia de 10%"],
    popular: true,
  },
  {
    name: "Anual",
    price: "R$ 497,00",
    period: "/ano",
    credits: 120,
    features: ["120 créditos por ano", "6GB de materiais", "Simulados ilimitados", "Exportação PDF", "Suporte VIP", "Economia de 15%", "Acesso antecipado"],
    popular: false,
  },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function SectionReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {children}
    </div>
  );
}

function Nav({ onLogin }: { onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#020b15]/90 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)" }}>
            <Zap className="w-5 h-5 text-[#020b15]" />
          </div>
          <span className="text-lg font-bold text-gradient">SaúdeStudy</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#8a9bb8]">
          <button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">Recursos</button>
          <button onClick={() => scrollTo("subjects")} className="hover:text-white transition-colors">Matérias</button>
          <button onClick={() => scrollTo("plans")} className="hover:text-white transition-colors">Planos</button>
          <button onClick={() => scrollTo("founder")} className="hover:text-white transition-colors">Idealizador</button>
        </div>
        <button onClick={onLogin} className="btn-primary px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5">
          Acessar <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}

function FounderSection() {
  const { photo, displayPhoto, updatePhoto } = useFounderPhoto();
  const isAdmin = useIsAdmin();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor, envie apenas imagens (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
      return;
    }
    updatePhoto(file);
  };

  return (
    <section id="founder" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionReveal className="glass-panel rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 50% 50%, rgba(10, 219, 209, 0.3), transparent 70%)" }} />
          <div className="relative z-10">
            {/* Photo */}
            <div className="relative mx-auto mb-6" style={{ width: "9rem", height: "9rem" }}>
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Robson Cordeiro dos Santos"
                  className="w-36 h-36 rounded-full object-cover mx-auto"
                  style={{ boxShadow: "0 0 40px rgba(10, 219, 209, 0.3)", border: "3px solid rgba(10, 219, 209, 0.3)" }}
                />
              ) : (
                <div className="w-36 h-36 rounded-full mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)", boxShadow: "0 0 40px rgba(10, 219, 209, 0.3)" }}>
                  <GraduationCap className="w-12 h-12 text-[#020b15]" />
                </div>
              )}
              {/* Edit button — admin only */}
              {isAdmin && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)", border: "2px solid #020b15" }}
                  title="Alterar foto do idealizador"
                >
                  <Camera className="w-4 h-4 text-[#020b15]" />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Upload hint — admin only */}
            {isAdmin && !photo && (
              <p className="text-[10px] text-[#8a9bb8] mb-4 flex items-center justify-center gap-1">
                <Pencil className="w-3 h-3" />
                Clique no ícone da câmera para enviar uma foto personalizada
              </p>
            )}

            <h2 className="text-2xl font-bold text-white mb-2">Robson Cordeiro dos Santos</h2>
            <p className="text-sm text-[#0adbd1] font-medium mb-6">Idealizador e Fundador do SaúdeStudy</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8 max-w-xl mx-auto">
              {[
                "Gestão Pública",
                "Licenciatura em Matemática",
                "Epidemiologia e Vigilância em Saúde",
                "Inteligência Artificial",
                "Gestão de Projetos",
                "Compliance",
              ].map((pos, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <GraduationCap className="w-3.5 h-3.5 text-[#0adbd1] flex-shrink-0" />
                  <p className="text-[10px] text-white text-left">{pos}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-[#8a9bb8] leading-relaxed max-w-2xl mx-auto">
              O SaúdeStudy nasceu da paixão por educação e tecnologia, com o objetivo de transformar
              a forma como estudantes da área da saúde se preparam para concursos. Utilizando
              inteligência artificial de ponta, criamos uma plataforma que personaliza o
              aprendizado e maximiza os resultados.
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

export default function Landing({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen" style={{ background: "#020b15" }}>
      <Nav onLogin={onLogin} />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <ParticleBackground />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(10, 219, 209, 0.06), transparent 60%)" }} />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <SectionReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: "rgba(10, 219, 209, 0.08)", border: "1px solid rgba(10, 219, 209, 0.15)" }}>
              <Star className="w-3.5 h-3.5 text-[#0adbd1]" />
              <span className="text-xs text-[#0adbd1]">Plataforma inteligente para concursos na área da saúde</span>
            </div>
          </SectionReveal>

          <SectionReveal className="transition-delay-100">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              Estude com{" "}
              <span className="text-gradient">Inteligência</span>
              <br />
              Artificial
            </h1>
          </SectionReveal>

          <SectionReveal className="transition-delay-200">
            <p className="text-lg text-[#8a9bb8] max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload seus materiais de estudo e deixe a IA criar simulados, quizzes e provas
              personalizadas para você. Prepare-se para concursos de forma inteligente.
            </p>
          </SectionReveal>

          <SectionReveal className="transition-delay-300">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={onLogin} className="btn-primary px-8 py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Começar Agora
              </button>
              <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="px-8 py-4 rounded-full text-sm font-semibold text-white hover:bg-white/5 transition-all" style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                Conheça os Recursos
              </button>
            </div>
          </SectionReveal>

          <SectionReveal className="transition-delay-500">
            <div className="mt-16 flex items-center justify-center gap-8 text-[#8a9bb8]">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">8+</p>
                <p className="text-xs">Matérias</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">IA</p>
                <p className="text-xs">Gerador</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">PDF</p>
                <p className="text-xs">Exportação</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">5</p>
                <p className="text-xs">Créditos grátis</p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionReveal className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-widest text-[#0adbd1] font-semibold">Recursos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">Tudo que você precisa para aprovar</h2>
            <p className="text-sm text-[#8a9bb8] max-w-xl mx-auto">Uma plataforma completa que une tecnologia de IA com conteúdo especializado para concursos na área da saúde.</p>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <SectionReveal key={i} className={`transition-delay-${Math.min(i * 100, 500)}`}>
                <div className="glass-panel rounded-2xl p-6 h-full glow-border group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
                    <f.icon className="w-6 h-6 text-[#0adbd1]" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-[#8a9bb8] leading-relaxed">{f.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-24 px-6" style={{ background: "rgba(10, 219, 209, 0.02)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-widest text-[#0adbd1] font-semibold">Como Funciona</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">Três passos para começar</h2>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Upload, title: "Envie seu Material", desc: "Faça upload de PDFs, DOCs e apostilas da sua matéria de estudo." },
              { step: "02", icon: Brain, title: "IA Gera o Simulado", desc: "Nossa inteligência artificial analisa e cria questões personalizadas." },
              { step: "03", icon: TrendingUp, title: "Estude e Acompanhe", desc: "Responda, veja o desempenho e melhore seus pontos fracos." },
            ].map((item, i) => (
              <SectionReveal key={i} className={`transition-delay-${i * 200}`}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(10, 219, 209, 0.15), rgba(14, 165, 233, 0.15))" }}>
                    <item.icon className="w-7 h-7 text-[#0adbd1]" />
                  </div>
                  <span className="text-[10px] text-[#0adbd1] font-bold tracking-wider">PASSO {item.step}</span>
                  <h3 className="text-lg font-semibold text-white mt-2 mb-2">{item.title}</h3>
                  <p className="text-xs text-[#8a9bb8] leading-relaxed">{item.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SUBJECTS ═══ */}
      <section id="subjects" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionReveal className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-widest text-[#0adbd1] font-semibold">Matérias Disponíveis</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">Conteúdo especializado para sua área</h2>
            <p className="text-sm text-[#8a9bb8] max-w-xl mx-auto">Matérias cuidadosamente selecionadas para concursos na área da saúde e conhecimentos gerais.</p>
          </SectionReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((s, i) => (
              <SectionReveal key={i} className={`transition-delay-${Math.min(i * 100, 700)}`}>
                <div className="glass-panel rounded-2xl p-5 text-center group hover:border-[#0adbd1]/30 transition-all cursor-default">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-lg font-bold" style={{ background: "rgba(10, 219, 209, 0.1)", color: "#0adbd1" }}>
                    {s.name.charAt(0)}
                  </div>
                  <h3 className="text-xs font-semibold text-white mb-1">{s.name}</h3>
                  <p className="text-[10px] text-[#8a9bb8]">{s.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLANS ═══ */}
      <section id="plans" className="py-24 px-6" style={{ background: "rgba(10, 219, 209, 0.02)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-widest text-[#0adbd1] font-semibold">Planos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">Escolha seu plano</h2>
            <p className="text-sm text-[#8a9bb8] max-w-xl mx-auto">Comece com 5 créditos gratuitos e escolha o plano ideal para sua preparação.</p>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <SectionReveal key={i} className={`transition-delay-${i * 150}`}>
                <div
                  className={`glass-panel rounded-2xl p-6 relative ${plan.popular ? "border-[#0adbd1]/50" : ""}`}
                  style={plan.popular ? { boxShadow: "0 0 30px rgba(10, 219, 209, 0.1)" } : {}}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-[#020b15]" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)" }}>
                      MAIS POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-gradient">{plan.price}</span>
                    <span className="text-xs text-[#8a9bb8]">{plan.period}</span>
                  </div>
                  <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(10, 219, 209, 0.05)" }}>
                    <p className="text-xs text-[#8a9bb8]">Inclui</p>
                    <p className="text-lg font-bold text-[#0adbd1]">{plan.credits} créditos</p>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-[#8a9bb8]">
                        <Check className="w-3.5 h-3.5 text-[#0adbd1] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={onLogin} className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${plan.popular ? "btn-primary" : "text-[#0adbd1] hover:bg-[#0adbd1]/10"}`} style={!plan.popular ? { border: "1px solid rgba(10, 219, 209, 0.3)" } : {}}>
                    Escolher {plan.name}
                  </button>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDER ═══ */}
      <FounderSection />

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-6" style={{ background: "rgba(10, 219, 209, 0.03)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <SectionReveal>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Pronto para <span className="text-gradient">aprovare</span>?
            </h2>
            <p className="text-sm text-[#8a9bb8] mb-8 max-w-xl mx-auto">
              Junte-se a centenas de estudantes que estão transformando sua preparação com inteligência artificial.
              Comece agora com 5 créditos gratuitos.
            </p>
            <button onClick={onLogin} className="btn-primary px-10 py-4 rounded-full text-sm font-bold inline-flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Acessar a Plataforma
            </button>
          </SectionReveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)" }}>
                <Zap className="w-5 h-5 text-[#020b15]" />
              </div>
              <div>
                <span className="text-sm font-bold text-gradient">SaúdeStudy</span>
                <p className="text-[10px] text-[#8a9bb8]">IA para Concursos na Área da Saúde</p>
              </div>
            </div>
            <p className="text-[10px] text-[#8a9bb8]">
              © 2025 SaúdeStudy. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-1 text-[10px] text-[#8a9bb8]">
              <Heart className="w-3 h-3 text-[#ef4444]" />
              Criado por Robson Cordeiro dos Santos
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
