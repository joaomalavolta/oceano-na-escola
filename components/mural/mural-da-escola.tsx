"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Eye, EyeOff, Film, ImageIcon, Trash2 } from "lucide-react";

import { EscreverNoMural } from "./escrever-no-mural";
import {
  apagarPublicacao,
  listarPublicacoes,
  republicarNoMural,
  retirarDoMural,
  type PublicacaoDaEscola,
} from "@/lib/mural";

function quando(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * O mural na ficha da escola: escrever, e cuidar do que já foi escrito.
 *
 * Aqui aparecem também as publicações retiradas do ar, que a página
 * pública não mostra — é o único lugar de onde se pode voltar a
 * publicá-las ou apagá-las de vez.
 */
export function MuralDaEscola({ escolaId, aOrganizacao }: { escolaId: number; aOrganizacao: string }) {
  const [lista, setLista] = useState<PublicacaoDaEscola[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setLista(await listarPublicacoes(escolaId));
    setCarregando(false);
  }, [escolaId]);

  useEffect(() => {
    let ativo = true;
    listarPublicacoes(escolaId).then((l) => {
      if (!ativo) return;
      setLista(l);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [escolaId]);

  const agir = async (id: number, acao: () => Promise<{ erro: string | null }>) => {
    setOcupada(id);
    setErro(null);
    const { erro: falha } = await acao();
    if (falha) setErro(falha);
    await recarregar();
    setOcupada(null);
  };

  return (
    <div className="space-y-4">
      <EscreverNoMural escolaId={escolaId} aOrganizacao={aOrganizacao} onPublicado={recarregar} />

      {erro && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="h-16 rounded-sm bg-muted/40 animate-pulse" />
      ) : lista.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-sm p-3">
          Nada publicado no mural ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((p) => {
            const fotos = p.midias.filter((m) => m.tipo === "foto_mural").length;
            const videos = p.midias.length - fotos;
            return (
              <li key={p.id} className="border border-border rounded-sm p-3 space-y-2">
                <p className="text-xs whitespace-pre-line line-clamp-3 break-words">{p.texto}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span
                    className={`font-semibold uppercase tracking-wider text-[10px] ${
                      p.publicada ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {p.publicada ? "No ar" : "Fora do ar"}
                  </span>
                  <span>{quando(p.publicada_em ?? p.criado_em)}</span>
                  {fotos > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> {fotos}
                    </span>
                  )}
                  {videos > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Film className="w-3 h-3" /> {videos}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      disabled={ocupada === p.id}
                      onClick={() => agir(p.id, () => (p.publicada ? retirarDoMural(p.id) : republicarNoMural(p.id)))}
                      className="inline-flex items-center gap-1 px-2 py-1 font-semibold border border-border rounded-sm hover:bg-secondary disabled:opacity-50"
                    >
                      {p.publicada ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {p.publicada ? "Tirar do ar" : "Publicar de novo"}
                    </button>
                    <button
                      type="button"
                      disabled={ocupada === p.id}
                      onClick={() => {
                        if (window.confirm("Apagar esta publicação e os arquivos dela? Não tem volta.")) {
                          agir(p.id, () => apagarPublicacao(p));
                        }
                      }}
                      className="p-1 rounded-sm hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      aria-label="Apagar publicação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
