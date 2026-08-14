"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Hourglass,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { listarMunicipios, type Municipio } from "@/lib/cadastro-escola";
import { criarTurma } from "@/lib/cadastro-expedicao";
import { Voltar } from "@/components/navegacao/voltar";
import {
  carregarEscolaEditavel,
  salvarEscola,
  listarTurmasDaEscola,
  salvarTurma,
  apagarTurma,
  definirVisibilidade,
  pedirAnalise,
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
      termos_ok: escola.termos_ok,
    });
    setSalvando(false);
    setAviso(
      erro ? { tipo: "erro", texto: erro } : { tipo: "ok", texto: "Escola atualizada." }
    );
  };

  /* Publicar age na hora, e não no botão de salvar como os demais
     campos: é a única coisa nesta tela que muda o que estranho vê, e
     misturá-la ao formulário fazia a página entrar no ar de brinde
     junto com uma correção de endereço. */
  const alternarPublicacao = async () => {
    if (!escola) return;
    setSalvando(true);
    setAviso(null);
    const alvo = !escola.publicada;
    const { erro } = await definirVisibilidade(escola.id, alvo);
    setSalvando(false);
    if (erro) return setAviso({ tipo: "erro", texto: erro });
    setEscola((prev) => (prev ? { ...prev, publicada: alvo } : prev));
    setAviso({
      tipo: "ok",
      texto: alvo ? "A página da escola está no ar." : "A página da escola saiu do ar.",
    });
  };

  const reenviar = async () => {
    if (!escola) return;
    setSalvando(true);
    setAviso(null);
    const { erro } = await pedirAnalise(escola.id);
    setSalvando(false);
    if (erro) return setAviso({ tipo: "erro", texto: erro });
    setEscola((prev) =>
      prev ? { ...prev, situacao: "pendente", motivo_recusa: null } : prev
    );
    setAviso({ tipo: "ok", texto: "Cadastro reenviado. O Ecosurf vai analisar de novo." });
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
      {/* Ao painel, e não à página pública da escola: o cabeçalho logo
          abaixo já leva lá, com o verbo certo — "ver" é conferir o
          resultado, "voltar" é sair daqui. Dois links para o mesmo
          lugar, com nomes diferentes, seriam dois caminhos falsos. */}
      <Voltar para="painel" />
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

        {/* Enquanto o cadastro não passa pelo Ecosurf, no lugar do botão
            de publicar vai o estado dele. Um botão desligado sem
            explicação faria parecer defeito. */}
        {escola.situacao === "pendente" && (
          <div className="p-3 rounded-sm border border-amber-500/40 bg-amber-500/10 space-y-1">
            <p className="text-sm font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <Hourglass className="w-3.5 h-3.5 shrink-0" />
              Cadastro em análise pelo Instituto Ecosurf
            </p>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              A escola vai ao mapa da rede quando o Ecosurf aprovar. Até lá nada dela aparece
              para quem não tem login — mas o trabalho não precisa esperar: a turma já pode sair
              a campo, e as expedições ficam guardadas para publicar depois.
            </p>
          </div>
        )}

        {escola.situacao === "recusada" && (
          <div className="p-3 rounded-sm border border-destructive/40 bg-destructive/10 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-1.5 text-destructive">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              Cadastro recusado
            </p>
            {escola.motivo_recusa && (
              <p className="text-[11px] leading-relaxed border-l-2 border-destructive/40 pl-2.5 text-foreground">
                {escola.motivo_recusa}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Corrija o que foi apontado, salve, e reenvie para uma nova análise.
            </p>
            <button
              type="button"
              onClick={reenviar}
              disabled={salvando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-sm disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Reenviar para análise
            </button>
          </div>
        )}

        {escola.situacao === "aprovada" && (
          <button
            type="button"
            onClick={alternarPublicacao}
            disabled={salvando}
            className="flex items-start gap-3 w-full text-left p-3 rounded-sm border border-border hover:bg-secondary/50 transition-colors disabled:opacity-50"
          >
            <span
              className={`mt-0.5 w-9 h-5 rounded-full relative shrink-0 transition-colors ${
                escola.publicada ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  escola.publicada ? "left-4.5" : "left-0.5"
                }`}
              />
            </span>
            <span className="min-w-0">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Escola publicada no mapa
              </span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">
                Cadastro aprovado pelo Ecosurf. Este botão tira a página do ar e a devolve
                quando quiser — vale na hora, sem passar pelo botão de salvar.
              </span>
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => alterar("termos_ok", !escola.termos_ok)}
          className="flex items-start gap-3 w-full text-left p-3 rounded-sm border border-border hover:bg-secondary/50 transition-colors"
        >
          <span
            className={`mt-0.5 w-9 h-5 rounded-full relative shrink-0 transition-colors ${
              escola.termos_ok ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                escola.termos_ok ? "left-4.5" : "left-0.5"
              }`}
            />
          </span>
          <span className="min-w-0">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Termo de uso de imagem registrado
            </span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">
              A escola declara ter colhido o termo. Sem ele, nenhuma foto entra na galeria
              pública, mesmo curada.
            </span>
          </span>
        </button>
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
