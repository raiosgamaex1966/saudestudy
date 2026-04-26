import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useLocalSubjects } from "@/hooks/useLocalData";
import {
  Brain,
  FileQuestion,
  Clock,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Flag,
  Send,
} from "lucide-react";

type Question = {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type SimConfig = {
  type: "quiz" | "exam" | "questionnaire";
  subjectId: number;
  title: string;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
};

export default function Simulados() {
  const utils = trpc.useUtils();

  const [step, setStep] = useState<"create" | "taking" | "result">("create");
  const [config, setConfig] = useState<SimConfig>({
    type: "exam",
    subjectId: 0,
    title: "",
    questionCount: 10,
    difficulty: "medium",
    timeLimit: 60,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null);

  const localSubjects = useLocalSubjects();
  const { data: subjects } = trpc.subject.list.useQuery();
  const subjectsData = subjects && subjects.length > 0 ? subjects : localSubjects;
  const { data: simulations } = trpc.simulation.list.useQuery();

  const generateMutation = trpc.simulation.generate.useMutation({
    onSuccess: (data) => {
      setQuestions(data.questions);
      setGenerating(false);
      setStep("taking");
      setCurrentQuestion(0);
      setAnswers({});
      setFlagged(new Set());
    },
    onError: (err) => {
      setError(err.message);
      setGenerating(false);
    },
  });

  const startAttemptMutation = trpc.attempt.start.useMutation({
    onSuccess: (data) => {
      setAttemptId(data.id);
    },
  });

  const submitAttemptMutation = trpc.attempt.submit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep("result");
      utils.credit.getBalance.invalidate();
      utils.attempt.list.invalidate();
    },
  });

  const handleGenerate = () => {
    if (!config.subjectId || !config.title) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    setError("");
    setGenerating(true);
    generateMutation.mutate({
      subjectId: config.subjectId,
      type: config.type,
      title: config.title,
      questionCount: config.questionCount,
      config: {
        timeLimit: config.timeLimit,
        difficulty: config.difficulty,
      },
    });
  };

  const handleStartExisting = (simId: number) => {
    const sim = simulations?.find((s) => s.id === simId);
    if (!sim) return;
    const qs = JSON.parse(sim.questions as string) as Question[];
    setQuestions(qs);
    setStep("taking");
    setCurrentQuestion(0);
    setAnswers({});
    setFlagged(new Set());
    startAttemptMutation.mutate({ simulationId: simId });
  };

  const handleSubmit = () => {
    if (!attemptId) return;
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: Number(qId),
      selectedOption: ans,
    }));
    submitAttemptMutation.mutate({
      attemptId,
      answers: formattedAnswers,
      timeSpent: config.timeLimit * 60 - 0, // simplified
    });
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQuestion].id]: optionIndex }));
  };

  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  // Create View
  if (step === "create") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Criar Simulados</h1>
          <p className="text-sm text-[#8a9bb8] mt-1">
            Use inteligência artificial para criar provas personalizadas
          </p>
        </div>

        {/* Create Card */}
        <div className="glass-panel rounded-2xl p-6 glow-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
              <Brain className="w-5 h-5 text-[#0adbd1]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Monte sua Prova Personalizada</h2>
              <p className="text-[10px] text-[#8a9bb8]">Selecione as matérias e monte do seu próprio jeito</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl text-xs text-[#ef4444]" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Type */}
            <div className="grid grid-cols-3 gap-3">
              {(["quiz", "exam", "questionnaire"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setConfig((prev) => ({ ...prev, type: t }))}
                  className={`py-3 px-4 rounded-xl text-xs font-medium transition-all border ${
                    config.type === t
                      ? "border-[#0adbd1]/50 text-[#0adbd1]"
                      : "border-white/10 text-[#8a9bb8] hover:border-white/20"
                  }`}
                  style={config.type === t ? { background: "rgba(10, 219, 209, 0.1)" } : { background: "transparent" }}
                >
                  {t === "quiz" ? "Quiz" : t === "exam" ? "Prova" : "Questionário"}
                </button>
              ))}
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Matéria *</label>
              <select
                value={config.subjectId || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, subjectId: Number(e.target.value) }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                <option value="">Selecione uma matéria</option>
                {(subjectsData ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Título do Simulado *</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Simulado de Enfermagem - Prova 1"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
              />
            </div>

            {/* Question Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#8a9bb8] mb-1.5 block">Quantidade de Questões</label>
                <select
                  value={config.questionCount}
                  onChange={(e) => setConfig((prev) => ({ ...prev, questionCount: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                  style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                >
                  {[5, 10, 15, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>{n} questões</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8a9bb8] mb-1.5 block">Dificuldade</label>
                <select
                  value={config.difficulty}
                  onChange={(e) => setConfig((prev) => ({ ...prev, difficulty: e.target.value as "easy" | "medium" | "hard" }))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                  style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>

            {/* Time Limit */}
            <div>
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Tempo Limite (minutos)</label>
              <input
                type="number"
                value={config.timeLimit}
                onChange={(e) => setConfig((prev) => ({ ...prev, timeLimit: Number(e.target.value) }))}
                min={5}
                max={180}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full btn-primary py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  CRIAR MINHA PROVA AGORA (1 crédito)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Available Simulations */}
        {simulations && simulations.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Simulados Disponíveis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {simulations.map((sim) => (
                <div key={sim.id} className="glass-panel rounded-2xl p-5 glow-border">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-wider text-[#0adbd1] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
                      {sim.type === "quiz" ? "Quiz" : sim.type === "exam" ? "Prova" : "Questionário"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{sim.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#8a9bb8] mb-4">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="w-3 h-3" />
                      {Array.isArray(sim.questions) ? sim.questions.length : JSON.parse(sim.questions as string || "[]").length} questões
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {sim.config ? `${JSON.parse(sim.config as string)?.timeLimit || 60} min` : "60 min"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleStartExisting(sim.id)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                    style={{ background: "rgba(10, 219, 209, 0.1)", color: "#0adbd1" }}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Iniciar Simulado
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Taking View
  if (step === "taking" && questions.length > 0) {
    const q = questions[currentQuestion];
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #0adbd1, #0ea5e9)",
              }}
            />
          </div>
          <span className="text-xs text-[#8a9bb8] whitespace-nowrap">
            {Object.keys(answers).length}/{questions.length}
          </span>
        </div>

        {/* Question Counter */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-[#8a9bb8]">
            Questão <span className="text-white font-bold">{currentQuestion + 1}</span> de {questions.length}
          </h2>
          <button
            onClick={() => {
              setFlagged((prev) => {
                const next = new Set(prev);
                if (next.has(q.id)) next.delete(q.id);
                else next.add(q.id);
                return next;
              });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              flagged.has(q.id)
                ? "text-[#f59e0b] bg-[#f59e0b]/10"
                : "text-[#8a9bb8] hover:bg-white/5"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            {flagged.has(q.id) ? "Marcada" : "Marcar"}
          </button>
        </div>

        {/* Question Card */}
        <div className="glass-panel rounded-2xl p-6 lg:p-8">
          <p className="text-base lg:text-lg text-white font-medium leading-relaxed mb-6">
            {q.text}
          </p>

          <div className="space-y-3">
            {q.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left text-sm transition-all border ${
                  answers[q.id] === i
                    ? "border-[#0adbd1]/50 bg-[#0adbd1]/10 text-white"
                    : "border-white/10 text-[#8a9bb8] hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    answers[q.id] === i
                      ? "bg-[#0adbd1] text-[#020b15]"
                      : "bg-white/5 text-[#8a9bb8]"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{option}</span>
                {answers[q.id] === i && <CheckCircle2 className="w-5 h-5 text-[#0adbd1] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[#8a9bb8] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2"
            >
              Próxima
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitAttemptMutation.isPending}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {submitAttemptMutation.isPending ? "Enviando..." : "Finalizar Prova"}
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-[#8a9bb8] mb-3">Navegador de Questões</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(i)}
                className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                  currentQuestion === i
                    ? "bg-[#0adbd1] text-[#020b15]"
                    : answers[q.id] !== undefined
                    ? "bg-[#10b981]/20 text-[#10b981]"
                    : flagged.has(q.id)
                    ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                    : "bg-white/5 text-[#8a9bb8] hover:bg-white/10"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Result View
  if (step === "result" && result) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="glass-panel rounded-2xl p-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
            background: result.score >= 70
              ? "rgba(16, 185, 129, 0.2)"
              : result.score >= 50
              ? "rgba(245, 158, 11, 0.2)"
              : "rgba(239, 68, 68, 0.2)",
          }}>
            <CheckCircle2 className={`w-10 h-10 ${
              result.score >= 70 ? "text-[#10b981]" : result.score >= 50 ? "text-[#f59e0b]" : "text-[#ef4444]"
            }`} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {result.score >= 70 ? "Parabéns!" : result.score >= 50 ? "Bom trabalho!" : "Continue estudando!"}
          </h2>
          <p className="text-sm text-[#8a9bb8] mb-6">
            {result.score >= 70
              ? "Você demonstrou excelente domínio do conteúdo"
              : result.score >= 50
              ? "Você está no caminho certo, mas precisa revisar alguns pontos"
              : "Não desanime! Revise o material e tente novamente"}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
              <p className="text-2xl font-bold text-white">{result.score.toFixed(0)}%</p>
              <p className="text-[10px] text-[#8a9bb8]">Nota Final</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
              <p className="text-2xl font-bold text-[#10b981]">{result.correctCount}</p>
              <p className="text-[10px] text-[#8a9bb8]">Acertos</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
              <p className="text-2xl font-bold text-[#ef4444]">{result.totalQuestions - result.correctCount}</p>
              <p className="text-[10px] text-[#8a9bb8]">Erros</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep("create"); setResult(null); setQuestions([]); }}
              className="px-6 py-2.5 rounded-xl text-sm text-[#8a9bb8] hover:bg-white/5 transition-all"
              style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
            >
              Voltar ao início
            </button>
            <button
              onClick={() => { setStep("taking"); setCurrentQuestion(0); }}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Revisar Questões
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
