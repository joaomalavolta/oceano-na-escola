"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { School, Users, FileCheck2, Check, AlertTriangle, Plus, Trash2 } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { useSessao } from "@/lib/sessao";
import {
  listarMunicipios,
  cadastrarEscola,
  type Municipio,
} from "@/lib/cadastro-escola";

const ANO_ATUAL = new Date().getFullYear();

/** Fora do componente de propósito: definido dentro, seria um tipo novo
 *  a cada render, e o React remontaria o indicador a cada tecla. */
function Passo({
  atual,
  n,
  label,
  Icone,
}: {
  atual: 1 | 2 | 3;
  n: 1 | 2 | 3;
  label: string;
  Icone: typeof School;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-2.5 border rounded-sm text-xs font-semibold ${
        atual === n
          ? "border-primary bg-primary/10 text-primary"
          : atual > n
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
          : "border-border text-muted-foreground"
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
        {atual > n ? <Check className="w-3 h-3" /> : <Icone className="w-3 h-3" />}
      </div>
      <span className="truncate">
        {n}. {label}
      </span>
    </div>
  );
}

interface TurmaForm {
  nome: string;
  ano_letivo: number;
  nivel: string;
}

function OnboardingConteudo() {
  const router = useRouter();
  const { recarregarPerfil } = useSessao();

  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);

  const [nomeEscola, setNomeEscola] = useState("");
  const [municipioId, setMunicipioId] = useState<number | "">("");
  const [redeEnsino, setRedeEnsino] = useState("Municipal");
  const [endereco, setEndereco] = useState("");
  const [lat, setLat] = useState(-24.1875);
  const [lng, setLng] = useState(-46.8015);
  const [apresentacao, setApresentacao] = useState("");

  // Várias turmas desde o cadastro: uma expedição pode reunir mais de uma,
  // e obrigar a criar uma por vez tornaria isso trabalho manual repetido.
  const [turmas, setTurmas] = useState<TurmaForm[]>([
    { nome: "", ano_letivo: ANO_ATUAL, nivel: "Fundamental II" },
  ]);

  const [termosOk, setTermosOk] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    listarMunicipios().then((m) => ativo && setMunicipios(m));
    return () => {
      ativo = false;
    };
  }, []);

  const alterarTurma = (i: number, campo: keyof TurmaForm, valor: string | number) =>
    setTurmas((prev) => prev.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)));

  const podeAvancar1 = nomeEscola.trim() !== "" && municipioId !== "";

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!termosOk) {
      setErro("É necessário confirmar a coleta dos termos para concluir.");
      return;
    }
    if (municipioId === "") {
      setErro("Escolha o município da escola.");
      return;
    }

    setSalvando(true);
    const { slug, erro: falha } = await cadastrarEscola({
      nome: nomeEscola.trim(),
      municipio_id: Number(municipioId),
      rede_ensino: redeEnsino,
      endereco: endereco.trim(),
      apresentacao: apresentacao.trim(),
      lat,
      lng,
      termosOk,
      turmas,
    });
    setSalvando(false);

    if (falha || !slug) {
      setErro(falha ?? "Não foi possível concluir o cadastro.");
      return;
    }

    await recarregarPerfil();
    router.push("/painel");
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Cadastro da escola e das turmas</h1>
        <p className="text-xs text-muted-foreground mt-1">
          A escola é cadastrada em seu nome, e você fica vinculado a ela automaticamente.
        </p>

        <div className="grid grid-cols-3 gap-2 mt-6">
          <Passo atual={passo} n={1} label="Escola" Icone={School} />
          <Passo atual={passo} n={2} label="Turmas" Icone={Users} />
          <Passo atual={passo} n={3} label="Termos" Icone={FileCheck2} />
        </div>
      </div>

      <form onSubmit={handleFinalizar} className="space-y-5">
        {/* ── Passo 1 ─────────────────────────────────────────────── */}
        {passo === 1 && (
          <section className="bg-card border border-border rounded-md p-5 space-y-4 shadow-2xs">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Nome da escola
              </label>
              <input
                type="text"
                required
                value={nomeEscola}
                onChange={(e) => setNomeEscola(e.target.value)}
                placeholder="E.M. Professora Maria da Silva"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Município
                </label>
                <select
                  required
                  value={municipioId}
                  onChange={(e) => setMunicipioId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Escolha…</option>
                  {municipios.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} – {m.uf}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Não achou o seu município? Ele é cadastrado pelo Ecosurf, para que o
                  indicador por cidade não se parta entre grafias diferentes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Rede de ensino
                </label>
                <select
                  value={redeEnsino}
                  onChange={(e) => setRedeEnsino(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option>Municipal</option>
                  <option>Estadual</option>
                  <option>Federal</option>
                  <option>Privada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm tabular-nums bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm tabular-nums bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Apresentação
              </label>
              <textarea
                rows={3}
                value={apresentacao}
                onChange={(e) => setApresentacao(e.target.value)}
                placeholder="O que a escola monitora e desde quando."
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <button
              type="button"
              disabled={!podeAvancar1}
              onClick={() => setPasso(2)}
              className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              Continuar para as turmas
            </button>
          </section>
        )}

        {/* ── Passo 2 ─────────────────────────────────────────────── */}
        {passo === 2 && (
          <section className="bg-card border border-border rounded-md p-5 space-y-4 shadow-2xs">
            <p className="text-xs text-muted-foreground">
              Cadastre quantas turmas forem a campo. Uma expedição pode reunir mais de uma.
            </p>

            {turmas.map((t, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Turma
                  </label>
                  <input
                    type="text"
                    value={t.nome}
                    onChange={(e) => alterarTurma(i, "nome", e.target.value)}
                    placeholder="7º ano A"
                    className="w-full px-2.5 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Ano letivo
                  </label>
                  <input
                    type="number"
                    value={t.ano_letivo}
                    onChange={(e) => alterarTurma(i, "ano_letivo", Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-sm tabular-nums bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Nível
                  </label>
                  <select
                    value={t.nivel}
                    onChange={(e) => alterarTurma(i, "nivel", e.target.value)}
                    className="w-full px-2.5 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option>Fundamental I</option>
                    <option>Fundamental II</option>
                    <option>Médio</option>
                    <option>EJA</option>
                  </select>
                </div>
                <div className="col-span-1">
                  {turmas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTurmas((prev) => prev.filter((_, j) => j !== i))}
                      className="w-full py-2 text-muted-foreground hover:text-destructive"
                      aria-label="Remover turma"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setTurmas((prev) => [
                  ...prev,
                  { nome: "", ano_letivo: ANO_ATUAL, nivel: "Fundamental II" },
                ])
              }
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar turma
            </button>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasso(1)}
                className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setPasso(3)}
                className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* ── Passo 3 ─────────────────────────────────────────────── */}
        {passo === 3 && (
          <section className="bg-card border border-border rounded-md p-5 space-y-4 shadow-2xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termosOk}
                onChange={(e) => setTermosOk(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed">
                Confirmo que a escola colheu o <strong>termo de responsabilidade sobre os
                alunos</strong> e o <strong>termo de uso de imagem</strong>, e que eles estão
                arquivados na secretaria.
              </span>
            </label>

            <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
              Sem essa confirmação, nenhuma foto da escola aparece em página pública — a
              galeria exige o termo, além da curadoria do professor. O cadastro também vai para
              análise do Instituto Ecosurf, e a escola entra no mapa da rede quando ele aprovar.
              Você não precisa esperar por isso para trabalhar: a turma já pode sair a campo, e
              as expedições ficam guardadas até a publicação.
            </p>

            {erro && (
              <div className="p-3 rounded-sm text-xs bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPasso(2)}
                className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {salvando ? "Cadastrando…" : "Concluir cadastro"}
              </button>
            </div>
          </section>
        )}
      </form>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <OnboardingConteudo />
      </RotaProtegida>
    </div>
  );
}
