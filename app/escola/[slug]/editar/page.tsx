"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { listarMunicipios, type Municipio } from "@/lib/cadastro-escola";
import { criarTurma } from "@/lib/cadastro-expedicao";
import {
  carregarEscolaEditavel,
  salvarEscola,
  listarTurmasDaEscola,
  salvarTurma,
  apagarTurma,
  type EscolaEditavel,
  type TurmaEditavel,
} from "@/lib/administracao";

const rotulo = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1";
const campo =
  "w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring";

function EditarConteudo({ slug }: { slug: string }) {
  const [escola, setEscola] = useState<EscolaEditavel | null>(null);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [turmas, setTurmas] = useState<TurmaEditavel[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  // Turma em edição, e a nova.
  const [emEdicao, setEmEdicao] = useState<number | null>(null);
  const [rascunhoTurma, setRascunhoTurma] = useState({ nome: "", ano: 0, nivel: "" });
  const [novaTurma, setNovaTurma] = useState({
    nome: "",
    ano: new Date().getFullYear(),
    nivel: "",
  });

  useEffect(() => {
    let ativo = true;
    carregarEscolaEditavel(slug).then(async (e) => {
      if (!ativo) return;
      setEscola(e);
      if (e) {
        const [ms, ts] = await Promise.all([listarMunicipios(), listarTurmasDaEscola(e.id)]);
        if (!ativo) return;
        setMunicipios(ms);
        setTurmas(ts);
      }
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [slug]);

  const alterar = <K extends keyof EscolaEditavel>(campo: K, valor: EscolaEditavel[K]) =>
    setEscola((prev) => (prev ? { ...prev, [campo]: valor } : prev));

  const guardar = async () => {
    if (!escola) return;
    setSalvando(true);
    setAviso(null);
    const { erro } = await salvarEscola(escola.id, {
      nome: escola.nome,
      municipio_id: escola.municipio_id,
      rede_ensino: escola.rede_ensino,
      endereco: escola.endereco,
      apresentacao: escola.apresentacao,
      lat: escola.lat,
      lng: escola.lng,
      publicada: escola.publicada,
      termos_ok: escola.termos_ok,
    });
    setSalvando(false);
    setAviso(
      erro ? { tipo: "erro", texto: erro } : { tipo: "ok", texto: "Escola atualizada." }
    );
  };

  const recarregarTurmas = async () => {
    if (!escola) return;
    setTurmas(await listarTurmasDaEscola(escola.id));
  };

  const acrescentarTurma = async () => {
    if (!escola || novaTurma.nome.trim() === "") return;
    setSalvando(true);
    setAviso(null);
    const { erro } = await criarTurma(escola.id, novaTurma.nome, novaTurma.ano, novaTurma.nivel);
    setSalvando(false);
    if (erro) return setAviso({ tipo: "erro", texto: erro });
    setNovaTurma({ nome: "", ano: novaTurma.ano, nivel: "" });
    await recarregarTurmas();
  };

  const guardarTurma = async (id: number) => {
    setSalvando(true);
    setAviso(null);
    const { erro } = await salvarTurma(
      id,
      rascunhoTurma.nome,
      rascunhoTurma.ano,
      rascunhoTurma.nivel
    );
    setSalvando(false);
    if (erro) return setAviso({ tipo: "erro", texto: erro });
    setEmEdicao(null);
    await recarregarTurmas();
  };

  const removerTurma = async (id: number) => {
    setSalvando(true);
    setAviso(null);
    const { erro } = await apagarTurma(id);
    setSalvando(false);
    if (erro) return setAviso({ tipo: "erro", texto: erro });
    await recarregarTurmas();
  };

  if (carregando) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  if (!escola) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <EstadoContainer
          estado="erro"
          mensagemErro="Escola não encontrada, ou fora do alcance da sua conta. Editar exige vínculo com a escola."
        />
      </main>
    );
  }

  const semCoordenada = escola.lat === null || escola.lng === null;

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 space-y-5">
      <header className="border-b border-border pb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar escola
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {escola.nome} · endereço público <span className="font-mono">{escola.slug}</span>
          </p>
        </div>
        <Link
          href={`/escola/${escola.slug}`}
          className="text-xs text-primary hover:underline shrink-0"
        >
          Ver página pública
        </Link>
      </header>

      {/* Identificação */}
      <section className="bg-card border border-border rounded-md p-5 space-y-4 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
          Identificação
        </h2>

        <div>
          <label className={rotulo}>Nome</label>
          <input
            type="text"
            value={escola.nome}
            onChange={(e) => alterar("nome", e.target.value)}
            className={campo}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={rotulo}>Município</label>
            <select
              value={escola.municipio_id}
              onChange={(e) => alterar("municipio_id", Number(e.target.value))}
              className={campo}
            >
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} — {m.uf}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={rotulo}>Rede de ensino</label>
            <select
              value={escola.rede_ensino ?? ""}
              onChange={(e) => alterar("rede_ensino", e.target.value || null)}
              className={campo}
            >
              <option value="">Não informada</option>
              {["Municipal", "Estadual", "Federal", "Particular"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={rotulo}>Endereço</label>
          <input
            type="text"
            value={escola.endereco ?? ""}
            onChange={(e) => alterar("endereco", e.target.value || null)}
            className={campo}
          />
        </div>

        <div>
          <label className={rotulo}>Apresentação</label>
          <textarea
            rows={3}
            value={escola.apresentacao ?? ""}
            onChange={(e) => alterar("apresentacao", e.target.value || null)}
            placeholder="O que esta escola monitora e desde quando."
            className={campo}
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          O endereço público <span className="font-mono">{escola.slug}</span> não muda por aqui:
          trocá-lo quebraria todo link já compartilhado da escola.
        </p>
      </section>

      {/* Posição */}
      <section className="bg-card border border-border rounded-md p-5 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Posição no mapa
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={rotulo}>Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={escola.lat ?? ""}
              onChange={(e) => alterar("lat", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="-24.1875"
              className={`${campo} tabular-nums`}
            />
          </div>
          <div>
            <label className={rotulo}>Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={escola.lng ?? ""}
              onChange={(e) => alterar("lng", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="-46.8015"
              className={`${campo} tabular-nums`}
            />
          </div>
        </div>

        {semCoordenada && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Sem coordenada, a escola não aparece no mapa público mesmo publicada.
          </p>
        )}
      </section>

      {/* Publicação */}
      <section className="bg-card border border-border rounded-md p-5 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
          Publicação e termos
        </h2>

        {(
          [
            {
              chave: "publicada" as const,
              Icone: Globe,
              titulo: "Escola publicada no mapa",
              texto:
                "Enquanto não estiver, nada desta escola aparece para quem não tem login — nem expedição publicada, nem ocorrência.",
            },
            {
              chave: "termos_ok" as const,
              Icone: ShieldCheck,
              titulo: "Termo de uso de imagem registrado",
              texto:
                "A escola declara ter colhido o termo. Sem ele, nenhuma foto entra na galeria pública, mesmo curada.",
            },
          ]
        ).map(({ chave, Icone, titulo, texto }) => (
          <button
            key={chave}
            type="button"
            onClick={() => alterar(chave, !escola[chave])}
            className="flex items-start gap-3 w-full text-left p-3 rounded-sm border border-border hover:bg-secondary/50 transition-colors"
          >
            <span
              className={`mt-0.5 w-9 h-5 rounded-full relative shrink-0 transition-colors ${
                escola[chave] ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  escola[chave] ? "left-4.5" : "left-0.5"
                }`}
              />
            </span>
            <span className="min-w-0">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Icone className="w-3.5 h-3.5 text-primary" />
                {titulo}
              </span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">{texto}</span>
            </span>
          </button>
        ))}
      </section>

      {/* Turmas */}
      <section className="bg-card border border-border rounded-md p-5 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
          Turmas
        </h2>

        <div className="space-y-2">
          {turmas.map((t) =>
            emEdicao === t.id ? (
              <div key={t.id} className="grid grid-cols-[1fr_5rem_1fr_auto] gap-2 items-center">
                <input
                  type="text"
                  value={rascunhoTurma.nome}
                  onChange={(e) => setRascunhoTurma((p) => ({ ...p, nome: e.target.value }))}
                  className={campo}
                />
                <input
                  type="number"
                  value={rascunhoTurma.ano}
                  onChange={(e) => setRascunhoTurma((p) => ({ ...p, ano: Number(e.target.value) }))}
                  className={`${campo} tabular-nums`}
                />
                <input
                  type="text"
                  value={rascunhoTurma.nivel}
                  onChange={(e) => setRascunhoTurma((p) => ({ ...p, nivel: e.target.value }))}
                  placeholder="Nível"
                  className={campo}
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => guardarTurma(t.id)}
                    disabled={salvando}
                    className="px-2.5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-sm disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmEdicao(null)}
                    className="px-2.5 py-2 text-xs border border-border rounded-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 p-2.5 border border-border rounded-sm"
              >
                <span className="text-sm">
                  <strong>{t.nome}</strong>
                  <span className="text-muted-foreground tabular-nums"> · {t.ano_letivo}</span>
                  {t.nivel && <span className="text-muted-foreground"> · {t.nivel}</span>}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEmEdicao(t.id);
                      setRascunhoTurma({ nome: t.nome, ano: t.ano_letivo, nivel: t.nivel ?? "" });
                    }}
                    className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary"
                    aria-label="Editar turma"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerTurma(t.id)}
                    disabled={salvando}
                    className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    aria-label="Apagar turma"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          )}

          {turmas.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhuma turma cadastrada ainda.</p>
          )}
        </div>

        <div className="grid grid-cols-[1fr_5rem_1fr_auto] gap-2 items-center pt-2 border-t border-border">
          <input
            type="text"
            value={novaTurma.nome}
            onChange={(e) => setNovaTurma((p) => ({ ...p, nome: e.target.value }))}
            placeholder="7º ano B"
            className={campo}
          />
          <input
            type="number"
            value={novaTurma.ano}
            onChange={(e) => setNovaTurma((p) => ({ ...p, ano: Number(e.target.value) }))}
            className={`${campo} tabular-nums`}
          />
          <input
            type="text"
            value={novaTurma.nivel}
            onChange={(e) => setNovaTurma((p) => ({ ...p, nivel: e.target.value }))}
            placeholder="Nível (opcional)"
            className={campo}
          />
          <button
            type="button"
            onClick={acrescentarTurma}
            disabled={salvando || novaTurma.nome.trim() === ""}
            className="px-3 py-2 text-xs font-semibold bg-accent text-accent-foreground rounded-sm disabled:opacity-50 inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar
          </button>
        </div>
      </section>

      {aviso && (
        <div
          className={`p-3 rounded-sm text-xs flex items-start gap-2 border ${
            aviso.tipo === "erro"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {aviso.tipo === "erro" ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{aviso.texto}</span>
        </div>
      )}

      <button
        type="button"
        onClick={guardar}
        disabled={salvando}
        className="w-full py-3 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar alterações da escola
      </button>
    </main>
  );
}

export default function EditarEscolaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <EditarConteudo slug={slug} />
      </RotaProtegida>
    </div>
  );
}
