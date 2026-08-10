"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { School, Users, FileCheck2, MapPin, ArrowRight, Check, AlertTriangle } from "lucide-react";
import { getLocalStorageData, setLocalStorageData, MOCK_ESCOLAS, MOCK_TURMAS, EscolaDetalhada, Turma } from "@/lib/dados-mock";

export default function OnboardingPage() {
  const router = useRouter();
  const [passo, setPasso] = useState<1 | 2 | 3>(1);

  // Passo 1: Escola
  const [nomeEscola, setNomeEscola] = useState("");
  const [municipio, setMunicipio] = useState("Itanhaém");
  const [redeEnsino, setRedeEnsino] = useState("Municipal");
  const [endereco, setEndereco] = useState("");
  const [lat, setLat] = useState(-24.1875);
  const [lng, setLng] = useState(-46.8015);
  const [apresentacao, setApresentacao] = useState("");

  // Passo 2: Turma
  const [nomeTurma, setNomeTurma] = useState("7º Ano A");
  const [anoLetivo, setAnoLetivo] = useState(2026);
  const [nivel, setNivel] = useState("Ensino Fundamental II");

  // Passo 3: Termos
  const [termosOk, setTermosOk] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const handleFinalizar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!termosOk) {
      setErro("É necessário confirmar a coleta e autorização dos termos para concluir.");
      return;
    }

    setSalvando(true);

    setTimeout(() => {
      const slug = nomeEscola
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || `escola-${Date.now()}`;

      const escolas = getLocalStorageData<EscolaDetalhada[]>("escolas", MOCK_ESCOLAS);
      const novaEscola: EscolaDetalhada = {
        id: Date.now(),
        slug,
        nome: nomeEscola,
        apresentacao: apresentacao || `Escola ${redeEnsino} de ${municipio}.`,
        municipio,
        uf: "SP",
        endereco,
        lat,
        lng,
        termos_ok: termosOk,
        criado_em: new Date().toISOString().split("T")[0],
      };

      const turmas = getLocalStorageData<Turma[]>("turmas", MOCK_TURMAS);
      const novaTurma: Turma = {
        id: Date.now() + 1,
        escola_id: novaEscola.id,
        nome: nomeTurma,
        ano_letivo: anoLetivo,
        nivel,
      };

      setLocalStorageData("escolas", [novaEscola, ...escolas]);
      setLocalStorageData("turmas", [novaTurma, ...turmas]);

      setSalvando(false);
      router.push(`/expedicoes/nova`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">Cadastro da Escola e Primeira Turma</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure sua unidade em poucos minutos para começar a registrar saídas de campo.
          </p>

          {/* Indicador de Progresso */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <div
              className={`flex items-center gap-2 p-2.5 border rounded-sm text-xs font-semibold ${
                passo === 1
                  ? "border-primary bg-primary/10 text-primary"
                  : passo > 1
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                  : "border-border text-muted-foreground"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                {passo > 1 ? <Check className="w-3 h-3" /> : "1"}
              </div>
              <span className="truncate">1. Escola</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2.5 border rounded-sm text-xs font-semibold ${
                passo === 2
                  ? "border-primary bg-primary/10 text-primary"
                  : passo > 2
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                  : "border-border text-muted-foreground"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                {passo > 2 ? <Check className="w-3 h-3" /> : "2"}
              </div>
              <span className="truncate">2. Turma</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2.5 border rounded-sm text-xs font-semibold ${
                passo === 3
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                3
              </div>
              <span className="truncate">3. Termos</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-md p-6 shadow-sm">
          {/* Passo 1 */}
          {passo === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold border-b border-border pb-3 text-primary">
                <School className="w-4 h-4" />
                <span>Dados da Escola</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Nome da Escola
                </label>
                <input
                  type="text"
                  required
                  value={nomeEscola}
                  onChange={(e) => setNomeEscola(e.target.value)}
                  placeholder="Ex: E.M. Mapa Verde"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Município
                  </label>
                  <select
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Itanhaém">Itanhaém</option>
                    <option value="Peruíbe">Peruíbe</option>
                    <option value="Mongaguá">Mongaguá</option>
                    <option value="Praia Grande">Praia Grande</option>
                    <option value="São Vicente">São Vicente</option>
                    <option value="Santos">Santos</option>
                    <option value="Guarujá">Guarujá</option>
                    <option value="Bertioga">Bertioga</option>
                    <option value="Caraguatatuba">Caraguatatuba</option>
                    <option value="Ubatuba">Ubatuba</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Rede de Ensino
                  </label>
                  <select
                    value={redeEnsino}
                    onChange={(e) => setRedeEnsino(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Municipal">Municipal</option>
                    <option value="Estadual">Estadual</option>
                    <option value="Federal">Federal</option>
                    <option value="Particular">Particular / Comunitária</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua das Flores, 120 - Bairro Centro"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Apresentação Breve (opcional)
                </label>
                <textarea
                  rows={3}
                  value={apresentacao}
                  onChange={(e) => setApresentacao(e.target.value)}
                  placeholder="Conte um pouco sobre os projetos ambientais da sua escola..."
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  disabled={!nomeEscola.trim()}
                  onClick={() => setPasso(2)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 rounded-sm disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                >
                  <span>Próximo: Criar Turma</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Passo 2 */}
          {passo === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold border-b border-border pb-3 text-primary">
                <Users className="w-4 h-4" />
                <span>Primeira Turma Monitorada</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Nome ou Identificação da Turma
                </label>
                <input
                  type="text"
                  required
                  value={nomeTurma}
                  onChange={(e) => setNomeTurma(e.target.value)}
                  placeholder="Ex: 7º Ano A, Clube de Ciências, 1º EM"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Ano Letivo
                  </label>
                  <input
                    type="number"
                    value={anoLetivo}
                    onChange={(e) => setAnoLetivo(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Nível de Ensino
                  </label>
                  <select
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Ensino Fundamental I">Ensino Fundamental I (1º ao 5º ano)</option>
                    <option value="Ensino Fundamental II">Ensino Fundamental II (6º ao 9º ano)</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Educação de Jovens e Adultos (EJA)">EJA</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setPasso(1)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-sm hover:bg-secondary transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!nomeTurma.trim()}
                  onClick={() => setPasso(3)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 rounded-sm disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                >
                  <span>Próximo: Termos e Publicação</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Passo 3 */}
          {passo === 3 && (
            <form onSubmit={handleFinalizar} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold border-b border-border pb-3 text-primary">
                <FileCheck2 className="w-4 h-4" />
                <span>Confirmação dos Termos de Imagem e Publicação</span>
              </div>

              {erro && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <div className="p-4 bg-muted/50 border border-border rounded-sm text-xs space-y-2 text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Regras de Ciência Cidadã e Proteção da Privacidade:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Os dados brutos das contagens e trechos monitorados serão disponibilizados publicamente para fins científicos e de educação ambiental.</li>
                  <li>Nomes de estudantes **nunca** serão exibidos publicamente ou vinculados a fotos.</li>
                  <li>A galeria de fotos da escola na página pública só é exibida se os termos de consentimento estiverem regularmente colhidos na secretaria.</li>
                </ul>
              </div>

              <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-sm">
                <input
                  type="checkbox"
                  id="termos"
                  checked={termosOk}
                  onChange={(e) => setTermosOk(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                />
                <label htmlFor="termos" className="text-xs font-medium cursor-pointer">
                  Confirmo que a escola possui as autorizações de uso de imagem dos participantes e autoriza a publicação dos indicadores de ciência cidadã costeira.
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setPasso(2)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-sm hover:bg-secondary transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={salvando || !termosOk}
                  className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground hover:opacity-90 rounded-sm disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {salvando ? "Publicando Escola…" : "Concluir e Abrir Primeira Expedição"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
