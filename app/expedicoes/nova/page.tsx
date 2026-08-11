"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  Users,
  CloudRain,
  Wind,
  Waves,
  AlertTriangle,
  Route,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import {
  listarEscolasDoProfessor,
  listarTurmas,
  listarTerritorios,
  criarExpedicao,
  type EscolaDoProfessor,
  type TurmaDisponivel,
  type TerritorioDisponivel,
} from "@/lib/cadastro-expedicao";

const MARES = ["", "baixamar", "vazante", "enchente", "preamar"];
const CHUVA = ["", "nao", "sim", "nao_sei"];

const rotulo = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1";
const campo =
  "w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring";

function NovaExpedicaoConteudo() {
  const router = useRouter();

  const [escolas, setEscolas] = useState<EscolaDoProfessor[] | null>(null);
  const [turmas, setTurmas] = useState<TurmaDisponivel[]>([]);
  const [territorios, setTerritorios] = useState<TerritorioDisponivel[]>([]);

  const [escolaId, setEscolaId] = useState<number | null>(null);
  const [turmaIds, setTurmaIds] = useState<number[]>([]);
  const [territorioId, setTerritorioId] = useState<number | "">("");
  const [titulo, setTitulo] = useState("");
  const [dataCampo, setDataCampo] = useState(new Date().toISOString().split("T")[0]);
  const [horaInicio, setHoraInicio] = useState("08:30");
  const [horaFim, setHoraFim] = useState("11:00");
  const [extensao, setExtensao] = useState<number | "">("");
  const [nMapeadores, setNMapeadores] = useState<number | "">("");
  const [nEquipes, setNEquipes] = useState(2);
  const [mare, setMare] = useState("");
  const [chuva24h, setChuva24h] = useState("");
  const [vento, setVento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    listarEscolasDoProfessor().then((lista) => {
      if (!ativo) return;
      setEscolas(lista);
      if (lista.length > 0) setEscolaId(lista[0].id);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const escola = escolas?.find((e) => e.id === escolaId) ?? null;

  useEffect(() => {
    if (!escola) return;
    let ativo = true;
    listarTurmas(escola.id).then((t) => ativo && setTurmas(t));
    listarTerritorios(escola.municipio_id).then((t) => ativo && setTerritorios(t));
    return () => {
      ativo = false;
    };
  }, [escola]);

  if (!escolas) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  if (escolas.length === 0) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <EstadoContainer
          estado="vazio"
          mensagemVazia="A sua conta ainda não está vinculada a nenhuma escola. Cadastre a escola antes de abrir uma saída de campo."
        />
      </main>
    );
  }

  const alternarTurma = (id: number) =>
    setTurmaIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!escolaId) return setErro("Escolha a escola.");
    if (turmaIds.length === 0) return setErro("Selecione pelo menos uma turma.");

    setSalvando(true);
    const { id, erro: falha } = await criarExpedicao({
      escola_id: escolaId,
      turma_ids: turmaIds,
      territorio_id: territorioId === "" ? null : Number(territorioId),
      titulo: titulo.trim(),
      data_campo: dataCampo,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      extensao_m: extensao === "" ? null : Number(extensao),
      n_mapeadores: nMapeadores === "" ? null : Number(nMapeadores),
      n_equipes: nEquipes,
      mare,
      chuva_24h: chuva24h,
      vento: vento.trim(),
      observacoes: observacoes.trim(),
    });
    setSalvando(false);

    if (falha || !id) return setErro(falha ?? "Não foi possível abrir a expedição.");
    router.push(`/expedicoes/${id}/transcrever`);
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          Abrir nova saída de campo
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          A ficha impressa é o registro primário. Aqui entra o cabeçalho da expedição;
          a contagem vem depois, na transcrição.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identificação */}
        <section className="bg-card border border-border rounded-md p-5 space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
            1. Identificação
          </h2>

          {escolas.length > 1 && (
            <div>
              <label className={rotulo}>Escola</label>
              <select
                value={escolaId ?? ""}
                onChange={(e) => {
                  setEscolaId(Number(e.target.value));
                  setTurmaIds([]);
                  setTerritorioId("");
                }}
                className={campo}
              >
                {escolas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={rotulo}>Título da expedição</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Mapeamento da faixa norte"
              className={campo}
            />
          </div>

          <div>
            <label className={rotulo}>
              Turmas em campo{" "}
              <span className="normal-case font-normal text-[10px]">
                (uma expedição pode reunir mais de uma)
              </span>
            </label>
            {turmas.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Esta escola ainda não tem turmas cadastradas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {turmas.map((t) => {
                  const marcada = turmaIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => alternarTurma(t.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${
                        marcada
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.nome} · {t.ano_letivo}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Data e local */}
        <section className="bg-card border border-border rounded-md p-5 space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
            2. Data e local
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={rotulo}>
                <Calendar className="w-3 h-3 inline mr-1" />
                Data de campo
              </label>
              <input
                type="date"
                required
                value={dataCampo}
                onChange={(e) => setDataCampo(e.target.value)}
                className={campo}
              />
            </div>
            <div>
              <label className={rotulo}>
                <Clock className="w-3 h-3 inline mr-1" />
                Início
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className={campo}
              />
            </div>
            <div>
              <label className={rotulo}>
                <Clock className="w-3 h-3 inline mr-1" />
                Término
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className={campo}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={rotulo}>
                <MapPin className="w-3 h-3 inline mr-1" />
                Território
              </label>
              <select
                value={territorioId}
                onChange={(e) => setTerritorioId(e.target.value === "" ? "" : Number(e.target.value))}
                className={campo}
              >
                <option value="">Não informado</option>
                {territorios.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.tipo})
                  </option>
                ))}
              </select>
              {territorios.length === 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Nenhum território cadastrado neste município ainda.
                </p>
              )}
            </div>
            <div>
              <label className={rotulo}>
                <Route className="w-3 h-3 inline mr-1" />
                Extensão percorrida (m)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={extensao}
                onChange={(e) => setExtensao(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="200"
                className={`${campo} tabular-nums`}
              />
            </div>
          </div>
        </section>

        {/* Equipes e condições */}
        <section className="bg-card border border-border rounded-md p-5 space-y-4 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
            3. Mapeadores, equipes e condições
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={rotulo}>
                <Users className="w-3 h-3 inline mr-1" />
                Nº de mapeadores
              </label>
              <input
                type="number"
                min={0}
                value={nMapeadores}
                onChange={(e) => setNMapeadores(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="25"
                className={`${campo} tabular-nums`}
              />
            </div>
            <div>
              <label className={rotulo}>Nº de equipes em campo</label>
              <input
                type="number"
                min={1}
                max={20}
                value={nEquipes}
                onChange={(e) => setNEquipes(Math.max(1, Number(e.target.value) || 1))}
                className={`${campo} tabular-nums`}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Cada equipe vira uma coluna na ficha de transcrição.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={rotulo}>
                <Waves className="w-3 h-3 inline mr-1" />
                Maré
              </label>
              <select value={mare} onChange={(e) => setMare(e.target.value)} className={campo}>
                {MARES.map((m) => (
                  <option key={m} value={m}>
                    {m === "" ? "Não informado" : m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={rotulo}>
                <CloudRain className="w-3 h-3 inline mr-1" />
                Chuva nas últimas 24h
              </label>
              <select value={chuva24h} onChange={(e) => setChuva24h(e.target.value)} className={campo}>
                {CHUVA.map((c) => (
                  <option key={c} value={c}>
                    {c === "" ? "Não informado" : c === "nao_sei" ? "não sei" : c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={rotulo}>
                <Wind className="w-3 h-3 inline mr-1" />
                Vento
              </label>
              <input
                type="text"
                value={vento}
                onChange={(e) => setVento(e.target.value)}
                placeholder="Fraco, SE"
                className={campo}
              />
            </div>
          </div>

          <div>
            <label className={rotulo}>Observações da saída</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="O que a tabela não captura."
              className={campo}
            />
          </div>
        </section>

        {erro && (
          <div className="p-3 rounded-sm text-xs bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="w-full py-3 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {salvando ? "Abrindo…" : "Abrir expedição e transcrever a ficha"}
        </button>
      </form>
    </main>
  );
}

export default function NovaExpedicaoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <NovaExpedicaoConteudo />
      </RotaProtegida>
    </div>
  );
}
