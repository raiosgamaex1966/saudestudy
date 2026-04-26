import { Award, BookOpen, GraduationCap, Brain, Heart, Target, Lightbulb } from "lucide-react";

export default function Fundador() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="glass-panel rounded-2xl p-8 lg:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          background: "radial-gradient(circle at 50% 50%, rgba(10, 219, 209, 0.3), transparent 70%)",
        }} />
        <div className="relative z-10">
          <img
            src="/founder-robson.jpg"
            alt="Robson Cordeiro dos Santos"
            className="w-24 h-24 rounded-full mx-auto mb-6 object-cover"
            style={{
              boxShadow: "0 0 40px rgba(10, 219, 209, 0.3)",
              border: "3px solid rgba(10, 219, 209, 0.3)",
            }}
          />
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            Robson Cordeiro dos Santos
          </h1>
          <p className="text-sm text-[#0adbd1] font-medium mb-4">
            Idealizador e Fundador do SaúdeStudy
          </p>
          <p className="text-sm text-[#8a9bb8] max-w-2xl mx-auto leading-relaxed">
            Um projeto nascido da paixão por educação e tecnologia, com o objetivo de 
            transformar a forma como estudantes da área da saúde se preparam para concursos 
            e exames. Utilizando inteligência artificial de ponta, criamos uma plataforma 
            que personaliza o aprendizado e maximiza os resultados.
          </p>
        </div>
      </div>

      {/* Formation */}
      <div className="glass-panel rounded-2xl p-6 lg:p-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-[#0adbd1]" />
          Formação Acadêmica
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
              <GraduationCap className="w-4 h-4 text-[#0adbd1]" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Graduação</h3>
            <p className="text-xs text-[#8a9bb8]">Gestão Pública</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.03)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(14, 165, 233, 0.1)" }}>
              <BookOpen className="w-4 h-4 text-[#0ea5e9]" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Licenciatura</h3>
            <p className="text-xs text-[#8a9bb8]">Matemática</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-white mt-6 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#f59e0b]" />
          Pós-graduações
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: "Epidemiologia e Vigilância em Saúde", icon: Heart },
            { title: "Inteligência Artificial", icon: Brain },
            { title: "Gestão de Projetos", icon: Target },
            { title: "Projetos e Licenciamento Ambiental", icon: Lightbulb },
            { title: "Compliance", icon: Award },
          ].map((pos, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:border-[#0adbd1]/30"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
                <pos.icon className="w-4 h-4 text-[#0adbd1]" />
              </div>
              <p className="text-xs text-white">{pos.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vision */}
      <div className="glass-panel rounded-2xl p-6 lg:p-8">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-[#0adbd1]" />
          A Visão por trás do SaúdeStudy
        </h2>
        <div className="space-y-4 text-sm text-[#8a9bb8] leading-relaxed">
          <p>
            O SaúdeStudy nasceu da minha experiência como estudante e profissional da área da saúde. 
            Percebi que muitos estudantes enfrentam dificuldades para encontrar materiais de qualidade 
            e se organizar para concursos. A ideia surgiu: e se pudéssemos usar inteligência artificial 
            para transformar qualquer material de estudo em simulados personalizados?
          </p>
          <p>
            Com formação em Gestão Pública, Licenciatura em Matemática e especializações em áreas 
            diversas como Epidemiologia, Inteligência Artificial e Gestão de Projetos, pude unir 
            conhecimentos técnicos e pedagógicos para criar uma plataforma que realmente entende 
            as necessidades dos estudantes.
          </p>
          <p>
            Nosso objetivo é democratizar o acesso a ferramentas de preparação de alta qualidade, 
            permitindo que cada estudante tenha uma experiência de aprendizado personalizada e eficiente. 
            Acreditamos que a tecnologia, quando bem aplicada à educação, pode transformar vidas.
          </p>
        </div>

        <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(10, 219, 209, 0.05)", border: "1px solid rgba(10, 219, 209, 0.1)" }}>
          <p className="text-sm text-[#0adbd1] font-medium italic text-center">
            "A educação é a arma mais poderosa que você pode usar para mudar o mundo." 
            <span className="text-[#8a9bb8] not-italic block mt-1 text-xs">— Nelson Mandela</span>
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
            <Target className="w-6 h-6 text-[#0adbd1]" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-2">Missão</h3>
          <p className="text-xs text-[#8a9bb8]">
            Capacitar estudantes da saúde com tecnologia de IA para alcançar seus objetivos em concursos
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(14, 165, 233, 0.1)" }}>
            <Eye className="w-6 h-6 text-[#0ea5e9]" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-2">Visão</h3>
          <p className="text-xs text-[#8a9bb8]">
            Ser a principal plataforma de preparação para concursos na área da saúde do Brasil
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
            <Heart className="w-6 h-6 text-[#10b981]" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-2">Valores</h3>
          <p className="text-xs text-[#8a9bb8]">
            Inovação, acessibilidade, excelência e compromisso com o sucesso dos estudantes
          </p>
        </div>
      </div>
    </div>
  );
}

// Inline icon for Vision
function Eye({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
