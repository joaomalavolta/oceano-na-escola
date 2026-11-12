"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Eye, EyeOff, ImagePlus, Loader2, Trash2 } from "lucide-react";

import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import {
  enviarFoto,
  escolaTemTermo,
  listarFotos,
  type FotoEnviada,
} from "@/lib/fotos-da-escola";
import { curarEvidencia, removerEvidencia } from "@/lib/galeria";

type Modo =
  | { tipo: "foto_turma"; turmas: { id: number; nome: string }[] }
  | { tipo: "foto_campo"; expedicaoId: number };

interface Props {
  escolaId: number;
  modo: Modo;
  /** Quando a página já sabe; senão o componente lê do banco. */
  termosOk?: boolean;
}

/**
 * Envio e curadoria de fotos da turma ou de uma saída de campo.
 *
 * As duas etapas ficam juntas na mesma tela de propósito. Antes, a foto
 * enviada só podia ir a público pela página Galeria, e quem não sabia
 * disso enviava, esperava e não via a foto aparecer em lugar nenhum.
 * Aqui a foto nasce "só para a escola", e o botão para publicá-la está
 * ao lado dela.
 */
export function FotosEnviadas({ escolaId, modo, termosOk: termosDaPagina }: Props) {
  const [fotos, setFotos] = useState<FotoEnviada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termosDoBanco, setTermosDoBanco] = useState<boolean | null>(null);
  const [turmaId, setTurmaId] = useState<number | "">("");
  const [legenda, setLegenda] = useState("");
  const [progresso, setProgresso] = useState<{ feito: number; total: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<number | null>(null);

  const termosOk = termosDaPagina ?? termosDoBanco ?? false;
  const filtro = modo.tipo === "foto_turma" ? ({ tipo: "foto_turma" } as const) : { expedicaoId: modo.expedicaoId };
  const chaveFiltro = modo.tipo === "foto_turma" ? "turma" : `exp-${modo.expedicaoId}`;

  const recarregar = useCallback(async () => {
    setFotos(await listarFotos(escolaId, filtro));
    // `filtro` sai de `chaveFiltro`, que é o que muda de fato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolaId, chaveFiltro]);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      listarFotos(escolaId, filtro),
      termosDaPagina === undefined ? escolaTemTermo(escolaId) : Promise.resolve(null),
    ]).then(([lista, termo]) => {
      if (!ativo) return;
      setFotos(lista);
      if (termo !== null) setTermosDoBanco(termo);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolaId, chaveFiltro, termosDaPagina]);

  const enviar = async (arquivos: FileList | null) => {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    const lista = Array.from(arquivos);
    const falhas: string[] = [];
    for (let i = 0; i < lista.length; i++) {
      setProgresso({ feito: i, total: lista.length });
      const destino =
        modo.tipo === "foto_turma"
          ? ({ tipo: "foto_turma", turmaId: turmaId === "" ? null : turmaId } as const)
          : ({ tipo: "foto_campo", expedicaoId: modo.expedicaoId } as const);
      const { erro: falha } = await enviarFoto(escolaId, destino, lista[i], legenda);
      if (falha) falhas.push(`${lista[i].name}: ${falha}`);
    }
    setProgresso(null);
    setLegenda("");
    if (falhas.length > 0) setErro(`Não foram enviadas: ${falhas.join("; ")}`);
    await recarregar();
  };

  const alternar = async (f: FotoEnviada) => {
    setOcupada(f.id);
    setErro(null);
    const { erro: falha } = await curarEvidencia(f.id, f.status !== "publicada");
    if (falha) setErro(falha);
    await recarregar();
    setOcupada(null);
  };

  const apagar = async (f: FotoEnviada) => {
    if (!window.confirm("Apagar esta foto? O arquivo é removido de vez.")) return;
    setOcupada(f.id);
    setErro(null);
    const { erro: falha } = await removerEvidencia(f.id, f.storage_path);
    if (falha) setErro(falha);
    await recarregar();
    setOcupada(null);
  };

  const enviando = progresso !== null;

  return (
    <div className="space-y-3">
      <div className="bg-muted/30 border border-border rounded-sm p-3 space-y-2.5">
        <div className={modo.tipo === "foto_turma" ? "grid sm:grid-cols-2 gap-2" : ""}>
          {modo.tipo === "foto_turma" && (
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-2 text-sm bg-background border border-input rounded-sm"
              aria-label="Turma da foto"
            >
              <option value="">Turma: várias ou nenhuma em particular</option>
              {modo.turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="Legenda (opcional) — o que a turma está fazendo"
            className="w-full px-2.5 py-2 text-sm bg-background border border-input rounded-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Não escreva nome de aluno na legenda. A foto é registro coletivo da turma.
          </p>
          <label
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity cursor-pointer ${
              enviando ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            {enviando ? `Enviando ${progresso.feito + 1} de ${progresso.total}…` : "Enviar fotos"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={enviando}
              onChange={(e) => {
                enviar(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {!termosOk && !carregando && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Sem o termo de uso de imagem registrado na ficha da escola, as fotos ficam guardadas mas
          não podem ir a público.
        </p>
      )}

      {erro && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="h-24 rounded-sm bg-muted/40 animate-pulse" />
      ) : fotos.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-sm p-3">
          Nenhuma foto enviada ainda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map((f) => {
            const publica = f.status === "publicada";
            return (
              <li key={f.id} className="bg-card border border-border rounded-sm overflow-hidden">
                <FotoEvidencia
                  storagePath={f.storage_path}
                  alt={f.legenda ?? "Foto enviada"}
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="p-2 space-y-1.5">
                  {(f.legenda || f.turma_nome) && (
                    <p className="text-[11px] leading-snug line-clamp-2">
                      {f.turma_nome && <strong>{f.turma_nome}</strong>}
                      {f.turma_nome && f.legenda && " · "}
                      {f.legenda}
                    </p>
                  )}
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      publica ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {publica ? "Na página pública" : "Só para a escola"}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => alternar(f)}
                      disabled={ocupada === f.id || (!publica && !termosOk)}
                      title={!publica && !termosOk ? "Falta o termo de uso de imagem" : undefined}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-semibold border border-border rounded-sm hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      {publica ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {publica ? "Tirar do ar" : "Publicar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => apagar(f)}
                      disabled={ocupada === f.id}
                      aria-label="Apagar foto"
                      className="p-1 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
