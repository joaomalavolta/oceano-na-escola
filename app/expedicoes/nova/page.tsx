"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { Compass, Calendar, Clock, MapPin, Users, CloudRain, Wind, Waves, ArrowRight } from "lucide-react";
import { getLocalStorageData, setLocalStorageData, MOCK_EXPEDICOES, ExpedicaoDetalhada } from "@/lib/dados-mock";

export default function NovaExpedicaoPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("Expedição de Monitoramento Costeiro");
  const [turmaNome, setTurmaNome] = useState("7º Ano A");
  const [dataCampo, setDataCampo] = useState(new Date().toISOString().split("T")[0]);
  const [horaInicio, setHoraInicio] = useState("08:30");
  const [horaFim, setHoraFim] = useState("11:00");
  const [praia, setPraia] = useState("Praia do Sonho");
  const [nMapeadores, setNMapeadores] = useState(25);
  const [nEquipes, setNEquipes] = useState(2);
  const [mare, setMare] = useState("Baixa (0.3m)");
  const [chuva24h, setChuva24h] = useState("Não");
  const [vento, setVento] = useState("Fraco (SE)");
  const [protocoloCodigo, setProtocoloCodigo] = useState("RES");
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    setTimeout(() => {
      const expedicoes = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
      const novoId = Date.now();
      const proximoNumero = expedicoes.length + 1;

      // Gera equipes
      const equipes = Array.from({ length: nEquipes }, (_, i) => ({
        id: i + 1,
        nome: `Equipe ${String.fromCharCode(65 + i)}`,
        comprimento_m: 50,
        largura_m: 10,
        area_m2: 500,
      }));

      const novaExpedicao: ExpedicaoDetalhada = {
        id: novoId,
        numero: proximoNumero,
        titulo: titulo || `Expedição #${proximoNumero} — ${praia}`,
        escola_id: 1,
        escola_slug: "em-mapa-verde",
        escola_nome: "E.M. Mapa Verde",
        turma_id: 1,
        turma_nome: turmaNome,
        protocolo_codigo: protocoloCodigo,
        data_campo: dataCampo,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        praia,
        n_mapeadores: nMapeadores,
        mare,
        chuva_24h: chuva24h,
        vento,
        status: "rascunho",
        equipes,
        contagens: {},
        criado_em: new Date().toISOString().split("T")[0],
      };

      setLocalStorageData("expedicoes", [novaExpedicao, ...expedicoes]);
      setSalvando(false);
      router.push(`/expedicoes/${novoId}/transcrever`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <span>Abrir Nova Saída de Campo</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Preencha as informações básicas do território e das equipes antes de transcrever a ficha física.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-6 shadow-sm space-y-6">
          {/* Identificação Principal */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              1. Identificação da Atividade
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Título ou Nome da Expedição
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Expedição Outono — Praia do Sonho"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Turma Responsável
                </label>
                <select
                  value={turmaNome}
                  onChange={(e) => setTurmaNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="7º Ano A">7º Ano A</option>
                  <option value="8º Ano B">8º Ano B</option>
                  <option value="9º Ano A">9º Ano A</option>
                  <option value="1º Ano EM">1º Ano EM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Protocolo Científico
                </label>
                <select
                  value={protocoloCodigo}
                  onChange={(e) => setProtocoloCodigo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="RES">RES — Resíduos Costeiros (Macro > 2.5 cm)</option>
                  <option value="MIC">MIC — Microplásticos (1 mm – 5 mm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data e Local */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              2. Data e Localização
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Data de Campo</span>
                </label>
                <input
                  type="date"
                  required
                  value={dataCampo}
                  onChange={(e) => setDataCampo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Horário Início</span>
                </label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Horário Término</span>
                </label>
                <input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Praia ou Trecho de Monitoramento</span>
              </label>
              <input
                type="text"
                required
                value={praia}
                onChange={(e) => setPraia(e.target.value)}
                placeholder="Ex: Praia do Sonho, Suarão, Cibratel"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Condições Ambientais e Equipes */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              3. Mapeadores, Equipes e Condições
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Nº de Alunos Mapeadores</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={nMapeadores}
                  onChange={(e) => setNMapeadores(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Nº de Equipes em Campo
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={nEquipes}
                  onChange={(e) => setNEquipes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Maré</span>
                </label>
                <select
                  value={mare}
                  onChange={(e) => setMare(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Baixa (0.3m)">Baixa (0.3m)</option>
                  <option value="Média (0.7m)">Média (0.7m)</option>
                  <option value="Alta (1.2m)">Alta (1.2m)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Chuva nas últimas 24h</span>
                </label>
                <select
                  value={chuva24h}
                  onChange={(e) => setChuva24h(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Não">Não</option>
                  <option value="Sim (Fraca)">Sim (Fraca)</option>
                  <option value="Sim (Forte/Tempestade)">Sim (Forte)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Vento</span>
                </label>
                <select
                  value={vento}
                  onChange={(e) => setVento(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Fraco (SE)">Fraco (SE)</option>
                  <option value="Moderado (S)">Moderado (S)</option>
                  <option value="Forte (E)">Forte (E)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center gap-2"
            >
              <span>{salvando ? "Criando Expedição…" : "Avançar para Transcrição de Ficha"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
