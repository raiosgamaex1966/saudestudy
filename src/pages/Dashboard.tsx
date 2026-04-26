import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { useLocalSubjects } from "@/hooks/useLocalData";
import {
  BookOpen,
  Target,
  TrendingUp,
  Zap,
  Play,
  Clock,
  Award,
  Brain,
  Flame,
  ChevronRight,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const chartData = [
  { value: 65 }, { value: 72 }, { value: 68 }, { value: 85 },
  { value: 78 }, { value: 92 }, { value: 88 }, { value: 95 },
];

const pieData = [
  { name: "Usado", value: 2, color: "#0adbd1" },
  { name: "Disponível", value: 3, color: "rgba(10, 219, 209, 0.15)" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  

  const { data: simulations } = trpc.simulation.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: attempts } = trpc.attempt.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: creditData } = trpc.credit.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const localSubjects = useLocalSubjects();
  const { data: subjectList } = trpc.subject.list.useQuery();
  const subjectsData = subjectList && subjectList.length > 0 ? subjectList : localSubjects;

  const recentAttempts = attempts?.slice(0, 5) ?? [];
  const availableSims = simulations?.slice(0, 4) ?? [];

  const avgScore = recentAttempts.length > 0
    ? Math.round(
        recentAttempts.reduce((sum, a) => sum + parseFloat(a.score ?? "0"), 0) /
          recentAttempts.length
      )
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Painel de Estudos</h1>
          <p className="text-sm text-[#8a9bb8] mt-1">
            Acompanhe seu progresso e inicie novos simulados
          </p>
        </div>
        <button
          onClick={() => navigate("/simulados")}
          className="btn-primary px-5 py-2.5 rounded-full text-sm flex items-center gap-2 w-fit"
        >
          <Brain className="w-4 h-4" />
          Novo Simulado com IA
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Simulados Disponíveis */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
              <BookOpen className="w-5 h-5 text-[#0adbd1]" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#8a9bb8]">Disponíveis</span>
          </div>
          <p className="text-3xl font-bold text-white">{availableSims.length}</p>
          <p className="text-xs text-[#8a9bb8] mt-1">Simulados para praticar</p>
        </div>

        {/* Taxa de Aprovação */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <Target className="w-5 h-5 text-[#10b981]" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#8a9bb8]">Aprovação</span>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-white">{avgScore}%</p>
            <div className="w-20 h-8 mb-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0adbd1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-[#8a9bb8] mt-1">Média geral de acertos</p>
        </div>

        {/* Sequência */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
              <Flame className="w-5 h-5 text-[#f59e0b]" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#8a9bb8]">Sequência</span>
          </div>
          <p className="text-3xl font-bold text-white">{recentAttempts.length}</p>
          <p className="text-xs text-[#8a9bb8] mt-1">Simulados realizados</p>
        </div>

        {/* Créditos */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
              <Zap className="w-5 h-5 text-[#0adbd1]" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#8a9bb8]">Créditos</span>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-[#0adbd1]">{creditData?.credits ?? 5}</p>
            <div className="w-14 h-14 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={12}
                    outerRadius={20}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-[#8a9bb8] mt-1">1 crédito = 50MB</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulados Recomendados */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#0adbd1]" />
              Simulados Recomendados
            </h2>
            <button
              onClick={() => navigate("/simulados")}
              className="text-xs text-[#0adbd1] hover:underline flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {availableSims.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableSims.map((sim) => (
                <div
                  key={sim.id}
                  className="glass-panel rounded-2xl p-5 glow-border cursor-pointer group"
                  onClick={() => navigate(`/simulados`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-wider text-[#0adbd1] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
                      {sim.type === "quiz" ? "Quiz" : sim.type === "exam" ? "Prova" : "Questionário"}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#8a9bb8] group-hover:text-[#0adbd1] transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{sim.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#8a9bb8]">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {Array.isArray(sim.questions) ? sim.questions.length : JSON.parse(sim.questions as string || "[]").length} questões
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {sim.config ? `${JSON.parse(sim.config as string)?.timeLimit || 60} min` : "60 min"}
                    </span>
                  </div>
                  <button className="w-full mt-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all" style={{ background: "rgba(10, 219, 209, 0.1)", color: "#0adbd1" }}>
                    <Play className="w-3 h-3" />
                    Iniciar Simulado
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <Brain className="w-12 h-12 text-[#8a9bb8] mx-auto mb-3 opacity-50" />
              <p className="text-sm text-[#8a9bb8]">Nenhum simulado disponível ainda</p>
              <button
                onClick={() => navigate("/simulados")}
                className="btn-primary px-4 py-2 rounded-full text-xs mt-3"
              >
                Criar meu primeiro simulado
              </button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Últimas Tentativas */}
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#0adbd1]" />
              Últimas Tentativas
            </h3>
            {recentAttempts.length > 0 ? (
              <div className="space-y-3">
                {recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-xs text-white">Simulado #{attempt.simulationId}</p>
                      <p className="text-[10px] text-[#8a9bb8]">
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString("pt-BR")
                          : "Em andamento"}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        parseFloat(attempt.score ?? "0") >= 70
                          ? "bg-[#10b981]/10 text-[#10b981]"
                          : parseFloat(attempt.score ?? "0") >= 50
                          ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                          : "bg-[#ef4444]/10 text-[#ef4444]"
                      }`}
                    >
                      {parseFloat(attempt.score ?? "0").toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8a9bb8] text-center py-4">
                Você ainda não realizou nenhum simulado
              </p>
            )}
          </div>

          {/* Matérias */}
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-[#0adbd1]" />
              Matérias Disponíveis
            </h3>
            <div className="space-y-2">
              {(subjectsData ?? []).slice(0, 6).map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all group"
                  onClick={() => navigate("/materiais")}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(10, 219, 209, 0.1)", color: "#0adbd1" }}>
                    {subject.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate group-hover:text-[#0adbd1] transition-colors">
                      {subject.name}
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[#8a9bb8] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/materiais")}
              className="w-full mt-3 py-2 rounded-lg text-xs text-[#0adbd1] hover:bg-[#0adbd1]/10 transition-all"
            >
              Ver todas as matérias
            </button>
          </div>

          {/* Quick Action */}
          <div
            className="rounded-2xl p-5 cursor-pointer group transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(10, 219, 209, 0.1), rgba(14, 165, 233, 0.1))",
              border: "1px solid rgba(10, 219, 209, 0.2)",
            }}
            onClick={() => navigate("/simulados")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(10, 219, 209, 0.2)" }}>
                <Award className="w-5 h-5 text-[#0adbd1]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Gerar Prova IA</p>
                <p className="text-[10px] text-[#8a9bb8]">Custo: 1 crédito</p>
              </div>
            </div>
            <p className="text-xs text-[#8a9bb8]">
              Use inteligência artificial para criar questões personalizadas do seu material de estudo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
