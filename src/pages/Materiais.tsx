import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocalSubjects } from "@/hooks/useLocalData";
import { useSupabaseMaterials, uploadMaterial, deleteMaterial, isSupabaseConfigured } from "@/hooks/useSupabase";
import {
  Upload,
  FileText,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Trash2,
  Download,
} from "lucide-react";

export default function Materiais() {
  const { user } = useAuth();
  const localSubjects = useLocalSubjects();

  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const { materials, refetch } = useSupabaseMaterials(selectedSubject || undefined);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selectedSubject) {
      setUploadMsg("Selecione um arquivo e uma matéria");
      return;
    }
    setUploading(true);
    setUploadMsg("");

    const result = await uploadMaterial(file, file.name, selectedSubject, user?.id || 1);

    if (result.success) {
      setUploadMsg("Material enviado com sucesso!");
      setFile(null);
      refetch();
      setTimeout(() => {
        setUploadOpen(false);
        setUploadMsg("");
      }, 2000);
    } else {
      setUploadMsg(result.error || "Erro ao enviar");
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    await deleteMaterial(id);
    refetch();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredMaterials = materials?.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Base de Conhecimento</h1>
          <p className="text-sm text-[#8a9bb8] mt-1">
            {isSupabaseConfigured()
              ? "Upload sincronizado com Supabase + armazenamento local"
              : "Armazenamento local ativo — conecte o Supabase para sincronizar na nuvem"}
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="btn-primary px-5 py-2.5 rounded-full text-sm flex items-center gap-2 w-fit"
        >
          <Upload className="w-4 h-4" />
          Enviar Material
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9bb8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar na base..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#8a9bb8] outline-none focus:ring-2 focus:ring-[#0adbd1]/50 transition-all"
            style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
          />
        </div>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(Number(e.target.value))}
          className="px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#0adbd1]/50 transition-all cursor-pointer"
          style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
        >
          <option value={0}>Todas as matérias</option>
          {(localSubjects).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0adbd1]" />
          Documentos Carregados
          {isSupabaseConfigured() && (
            <span className="text-[10px] text-[#10b981] ml-2">(sincronizado com Supabase)</span>
          )}
        </h2>

        {filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="glass-panel rounded-2xl p-4 group hover:border-[#0adbd1]/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(10, 219, 209, 0.1)" }}>
                    <FileText className="w-5 h-5 text-[#0adbd1]" />
                  </div>
                  {mat.uploaded_by === user?.id && (
                    <button
                      onClick={() => handleDelete(mat.id)}
                      className="p-1.5 rounded-lg text-[#8a9bb8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white truncate mb-1">{mat.title}</h3>
                <div className="flex items-center gap-2 text-[10px] text-[#8a9bb8] mb-3">
                  <span>{formatSize(Number(mat.file_size))}</span>
                  <span>•</span>
                  <span>{mat.mime_type?.split("/")[1]?.toUpperCase() || "PDF"}</span>
                </div>
                <a
                  href={mat.file_url}
                  download={mat.title}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-medium transition-all"
                  style={{ background: "rgba(10, 219, 209, 0.1)", color: "#0adbd1" }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Material
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#8a9bb8] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#8a9bb8]">
              {search ? "Nenhum material encontrado" : "Nenhum material carregado"}
            </p>
          </div>
        )}
      </div>

      {/* Subject Cards */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Gerenciar Categorias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(localSubjects).map((subject) => (
            <div
              key={subject.id}
              onClick={() => setSelectedSubject(selectedSubject === subject.id ? 0 : subject.id)}
              className={`glass-panel rounded-2xl p-4 cursor-pointer transition-all ${
                selectedSubject === subject.id ? "border-[#0adbd1]/50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(10, 219, 209, 0.1)", color: "#0adbd1" }}>
                  {subject.name.charAt(0)}
                </div>
                <Upload className="w-3.5 h-3.5 text-[#8a9bb8]" />
              </div>
              <p className="text-xs font-semibold text-white truncate">{subject.name}</p>
              <p className="text-[10px] text-[#8a9bb8] mt-0.5">
                {materials?.filter((m) => m.subject_id === subject.id).length ?? 0} materiais
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}>
          <div className="glass-panel rounded-2xl p-6 w-full max-w-lg relative" style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)" }}>
            <button
              type="button"
              onClick={() => { setUploadOpen(false); setFile(null); setUploadMsg(""); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8a9bb8] hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Enviar Material</h2>
            <p className="text-xs text-[#8a9bb8] mb-5">
              {isSupabaseConfigured()
                ? "O arquivo sera salvo localmente e sincronizado com Supabase"
                : "O arquivo sera salvo localmente no seu navegador"}
            </p>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? "border-[#0adbd1] bg-[#0adbd1]/5"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto" />
                  <p className="text-sm text-white font-medium">{file.name}</p>
                  <p className="text-xs text-[#8a9bb8]">
                    {formatSize(file.size)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs text-[#ef4444] hover:underline"
                  >
                    Remover arquivo
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-[#8a9bb8] mx-auto mb-2" />
                  <p className="text-sm text-white mb-1">
                    Clique para selecionar ou arraste aqui
                  </p>
                  <p className="text-[10px] text-[#8a9bb8]">PDF, DOC, DOCX (máx. 250MB)</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Subject Select */}
            <div className="mt-4">
              <label className="text-xs text-[#8a9bb8] mb-1.5 block">Matéria *</label>
              <select
                value={selectedSubject || ""}
                onChange={(e) => setSelectedSubject(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#0adbd1]/50"
                style={{ background: "rgba(5, 25, 50, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                <option value="">Selecione uma matéria</option>
                {(localSubjects).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Status Message */}
            {uploadMsg && (
              <div className={`mt-3 flex items-center gap-2 text-xs ${uploadMsg.includes("sucesso") ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                {uploadMsg.includes("sucesso") ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {uploadMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => { setUploadOpen(false); setFile(null); setUploadMsg(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#8a9bb8] hover:bg-white/5 transition-all"
                style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || !selectedSubject || uploading}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Enviando..." : "Enviar Material"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
