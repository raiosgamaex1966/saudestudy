import { trpc } from "@/providers/trpc";
import { useState } from "react";
import {
  Zap,
  Check,
  CreditCard,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const plans = [
  {
    id: "monthly",
    name: "Mensal",
    price: "R$ 49,00",
    period: "/mês",
    credits: 10,
    features: [
      "10 créditos por mês",
      "500MB de materiais",
      "Simulados ilimitados",
      "Exportação PDF",
      "Suporte por email",
    ],
    popular: false,
  },
  {
    id: "semester",
    name: "Semestral",
    price: "R$ 265,00",
    period: "/semestre",
    credits: 60,
    features: [
      "60 créditos por semestre",
      "3GB de materiais",
      "Simulados ilimitados",
      "Exportação PDF",
      "Suporte prioritário",
      "20% de desconto",
    ],
    popular: true,
  },
  {
    id: "annual",
    name: "Anual",
    price: "R$ 497,00",
    period: "/ano",
    credits: 120,
    features: [
      "120 créditos por ano",
      "6GB de materiais",
      "Simulados ilimitados",
      "Exportação PDF",
      "Suporte VIP",
      "33% de desconto",
      "Acesso antecipado",
    ],
    popular: false,
  },
];

export default function Planos() {
  const utils = trpc.useUtils();
  const { data: creditData } = trpc.credit.getBalance.useQuery();
  const { data: history } = trpc.credit.getHistory.useQuery();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const purchaseMutation = trpc.credit.purchase.useMutation({
    onSuccess: () => {
      utils.credit.getBalance.invalidate();
      utils.credit.getHistory.invalidate();
      setShowConfirm(false);
      setSelectedPlan(null);
    },
  });

  const handlePurchase = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    purchaseMutation.mutate({
      plan: planId as "monthly" | "semester" | "annual",
      credits: plan.credits,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Planos e Créditos</h1>
        <p className="text-sm text-[#8a9bb8] mt-1">
          Escolha o plano ideal para seus estudos
        </p>
      </div>

      {/* Current Credits */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
          <Zap className="w-8 h-8 text-[#0adbd1]" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-[#8a9bb8]">Seu saldo atual</p>
          <p className="text-3xl font-bold text-[#0adbd1]">{creditData?.credits ?? 5} créditos</p>
          <p className="text-xs text-[#8a9bb8] mt-1">
            Plano atual: {creditData?.plan === "free" ? "Gratuito (5 iniciais)" : creditData?.plan === "monthly" ? "Mensal" : creditData?.plan === "semester" ? "Semestral" : "Anual"}
          </p>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs text-[#8a9bb8]">Cada crédito equivale a</p>
          <p className="text-lg font-semibold text-white">50MB de material</p>
        </div>
      </div>

      {/* How Credits Work */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#0adbd1]" />
          Como funcionam os créditos?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-xs font-bold text-[#020b15]" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)" }}>
              1
            </div>
            <p className="text-xs text-white font-medium mb-1">Upload de Material</p>
            <p className="text-[10px] text-[#8a9bb8]">Cada 50MB de arquivo consome 1 crédito</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-xs font-bold text-[#020b15]" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)" }}>
              2
            </div>
            <p className="text-xs text-white font-medium mb-1">Gerar Simulado</p>
            <p className="text-[10px] text-[#8a9bb8]">Cada simulado gerado por IA consome 1 crédito</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-xs font-bold text-[#020b15]" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)" }}>
              3
            </div>
            <p className="text-xs text-white font-medium mb-1">Baixar PDF</p>
            <p className="text-[10px] text-[#8a9bb8]">Downloads de simulados em PDF são gratuitos</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#0adbd1]" />
          Escolha seu Plano
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-panel rounded-2xl p-6 relative transition-all ${
                plan.popular ? "border-[#0adbd1]/50" : ""
              }`}
              style={plan.popular ? { boxShadow: "0 0 30px rgba(10, 219, 209, 0.1)" } : {}}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-[#020b15]" style={{ background: "linear-gradient(135deg, #0adbd1, #0ea5e9)" }}>
                  MAIS POPULAR
                </div>
              )}

              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-gradient">{plan.price}</span>
                <span className="text-xs text-[#8a9bb8]">{plan.period}</span>
              </div>

              <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(10, 219, 209, 0.05)" }}>
                <p className="text-xs text-[#8a9bb8]">Inclui</p>
                <p className="text-lg font-bold text-[#0adbd1]">{plan.credits} créditos</p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#8a9bb8]">
                    <Check className="w-3.5 h-3.5 text-[#0adbd1] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setShowConfirm(true);
                }}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  plan.popular
                    ? "btn-primary"
                    : "text-[#0adbd1] hover:bg-[#0adbd1]/10"
                }`}
                style={!plan.popular ? { border: "1px solid rgba(10, 219, 209, 0.3)" } : {}}
              >
                Escolher {plan.name}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      {history && history.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Histórico de Transações</h3>
          <div className="space-y-2">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-xs text-white">{tx.description || tx.type}</p>
                  <p className="text-[10px] text-[#8a9bb8]">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("pt-BR") : ""}
                  </p>
                </div>
                <span className={`text-xs font-bold ${tx.amount > 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}>
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-2">Confirmar Compra</h3>
            <p className="text-sm text-[#8a9bb8] mb-4">
              Você está adquirindo o plano{" "}
              <span className="text-[#0adbd1] font-semibold">
                {plans.find((p) => p.id === selectedPlan)?.name}
              </span>{" "}
              por{" "}
              <span className="text-white font-semibold">
                {plans.find((p) => p.id === selectedPlan)?.price}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setSelectedPlan(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#8a9bb8] hover:bg-white/5 transition-all"
                style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePurchase(selectedPlan)}
                disabled={purchaseMutation.isPending}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                {purchaseMutation.isPending ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
