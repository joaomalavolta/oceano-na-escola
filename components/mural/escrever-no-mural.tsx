"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, Megaphone, Send, X } from "lucide-react";

import {
  LIMITES,
  criarPublicacao,
  duracaoDoVideo,
  problemaDaMidia,
  tipoDaMidia,
} from "@/lib/mural";

interface Props {
  escolaId: number;
  /** "a escola" / "a escola de surf". */
  aOrganizacao: string;
  onPublicado?: () => void;
}

/**
 * O campo de escrever no mural.
 *
 * Publica na hora: quem escreve aqui responde pela escola, e escrever e
 * apertar "Publicar" já é a decisão de pôr no ar — registrada no banco
 * com o nome de quem publicou. Retirar ou apagar fica na ficha da
 * escola, a um clique.
 */
export function EscreverNoMural({ escolaId, aOrganizacao, onPublicado }: Props) {
  const [texto, setTexto] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  // Prévia local, sem enviar nada. As URLs são liberadas quando a lista muda.
  const previas = useMemo(
    () => arquivos.map((a) => ({ arquivo: a, url: URL.createObjectURL(a), tipo: tipoDaMidia(a) })),
    [arquivos]
  );
  useEffect(() => () => previas.forEach((p) => URL.revokeObjectURL(p.url)), [previas]);

  const escolher = async (lista: FileList | null) => {
    if (!lista) return;
    setFeito(false);
    const novos: File[] = [];
    const problemas: string[] = [];
    for (const a of Array.from(lista)) {
      const duracao = tipoDaMidia(a) === "video_mural" ? await duracaoDoVideo(a) : null;
      const p = problemaDaMidia(a, duracao);
      if (p) problemas.push(p);
      else novos.push(a);
    }
    const total = [...arquivos, ...novos];
    if (total.length > LIMITES.arquivos) {
      problemas.push(`Até ${LIMITES.arquivos} arquivos por publicação — os excedentes ficaram de fora.`);
    }
    setArquivos(total.slice(0, LIMITES.arquivos));
    setAvisos(problemas);
  };

  const publicar = async () => {
    if (texto.trim() === "") return;
    setEnviando(true);
    setErro(null);
    const { erro: falha } = await criarPublicacao(escolaId, texto, arquivos);
    setEnviando(false);
    if (falha) {
      setErro(falha);
      return;
    }
    setTexto("");
    setArquivos([]);
    setAvisos([]);
    setFeito(true);
    onPublicado?.();
  };

  const restante = LIMITES.texto - texto.length;

  return (
    <div className="bg-card border border-primary/30 rounded-md p-4 space-y-3 shadow-2xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
        <Megaphone className="w-3.5 h-3.5" />
        Escrever no mural
      </h3>

      <textarea
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value.slice(0, LIMITES.texto));
          setFeito(false);
        }}
        rows={4}
        placeholder={`O que ${aOrganizacao} está fazendo? Uma aula, um mutirão, uma conquista da turma…`}
        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm resize-y"
      />

      {previas.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {previas.map((p, i) => (
            <li key={p.url} className="relative">
              {p.tipo === "video_mural" ? (
                <video src={p.url} muted playsInline className="w-full aspect-square object-cover rounded-sm bg-black" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt="" className="w-full aspect-square object-cover rounded-sm" />
              )}
              {p.tipo === "video_mural" && (
                <span className="absolute bottom-1 left-1 px-1 text-[9px] font-bold uppercase bg-black/70 text-white rounded-sm">
                  vídeo
                </span>
              )}
              <button
                type="button"
                onClick={() => setArquivos((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Tirar este arquivo"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {avisos.length > 0 && (
        <ul className="text-[11px] text-amber-700 dark:text-amber-400 space-y-0.5">
          {avisos.map((a) => (
            <li key={a} className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {a}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary transition-colors cursor-pointer ${
            enviando || arquivos.length >= LIMITES.arquivos ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          Fotos ou vídeos
          <input
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            className="sr-only"
            onChange={(e) => {
              escolher(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <span className={`text-[11px] tabular-nums ${restante < 100 ? "text-amber-700" : "text-muted-foreground"}`}>
          {restante} caracteres
        </span>
        <button
          type="button"
          onClick={publicar}
          disabled={enviando || texto.trim() === ""}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {enviando ? "Publicando…" : "Publicar"}
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Vai para a página d{aOrganizacao} e para a linha do tempo da rede. Até {LIMITES.arquivos}{" "}
        arquivos; vídeos de até {LIMITES.videoSegundos} segundos e 50 MB. Não escreva nome de aluno:
        foto e vídeo são registro coletivo, e só aparecem com o termo de uso de imagem registrado.
      </p>

      {erro && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Nada foi publicado: {erro}
        </p>
      )}
      {feito && <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Publicado no mural.</p>}
    </div>
  );
}
