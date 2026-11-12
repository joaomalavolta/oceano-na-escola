"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import {
  apagarCoordenador,
  criarCoordenador,
  listarCoordenadores,
  moverCoordenador,
  salvarCoordenador,
  tirarFotoDoCoordenador,
  trocarFotoDoCoordenador,
  type Coordenador,
  type DadosDoCoordenador,
} from "@/lib/coordenacao";

const campo =
  "w-full px-2.5 py-1.5 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring";

const NOVO: DadosDoCoordenador = {
  nome: "",
  funcao: null,
  email: null,
  telefone: null,
  telefone_whatsapp: false,
  instagram: null,
  autorizado: false,
};

/**
 * Coordenação na ficha: uma ou mais pessoas, cada uma com foto e contato.
 *
 * Cada cartão salva sozinho, com o próprio botão. A foto grava na hora,
 * como as outras fotos da ficha.
 *
 * A marca "autorizou" é por pessoa e vem desmarcada. É ela que decide se
 * a pessoa aparece na página pública — com foto e contato, que são dados
 * pessoais de um adulto. A escola declara que perguntou; a plataforma
 * não publica ninguém que não tenha dito sim.
 */
export function CoordenacaoDaEscola({ escolaId }: { escolaId: number }) {
  const [lista, setLista] = useState<Coordenador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const recarregar = useCallback(async () => {
    setLista(await listarCoordenadores(escolaId));
    setCarregando(false);
  }, [escolaId]);

  useEffect(() => {
    let ativo = true;
    listarCoordenadores(escolaId).then((l) => {
      if (!ativo) return;
      setLista(l);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [escolaId]);

  const acrescentar = async () => {
    setCriando(true);
    setErro(null);
    const ordem = lista.length === 0 ? 0 : Math.max(...lista.map((c) => c.ordem)) + 1;
    const { erro: falha } = await criarCoordenador(escolaId, { ...NOVO, nome: "Nova pessoa" }, ordem);
    if (falha) setErro(falha);
    await recarregar();
    setCriando(false);
  };

  // Trocar de lugar com o vizinho. As ordens são renumeradas pela posição
  // na tela, para duas pessoas com a mesma ordem não ficarem presas.
  const mover = async (i: number, delta: -1 | 1) => {
    const j = i + delta;
    if (j < 0 || j >= lista.length) return;
    const nova = [...lista];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setLista(nova);
    await Promise.all(nova.map((c, k) => (c.ordem === k ? null : moverCoordenador(c.id, k))));
    await recarregar();
  };

  if (carregando) return <div className="h-24 rounded-sm bg-muted/40 animate-pulse" />;

  return (
    <div className="space-y-3">
      {lista.length === 0 && (
        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-sm p-3">
          Ninguém cadastrado na coordenação ainda.
        </p>
      )}

      {lista.map((c, i) => (
        <CartaoCoordenador
          key={c.id}
          escolaId={escolaId}
          coordenador={c}
          primeiro={i === 0}
          ultimo={i === lista.length - 1}
          onMover={(d) => mover(i, d)}
          onMudou={recarregar}
        />
      ))}

      {erro && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={acrescentar}
        disabled={criando}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
      >
        {criando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        Acrescentar pessoa à coordenação
      </button>
    </div>
  );
}

function CartaoCoordenador({
  escolaId,
  coordenador: c,
  primeiro,
  ultimo,
  onMover,
  onMudou,
}: {
  escolaId: number;
  coordenador: Coordenador;
  primeiro: boolean;
  ultimo: boolean;
  onMover: (delta: -1 | 1) => void;
  onMudou: () => Promise<void>;
}) {
  const [d, setD] = useState<DadosDoCoordenador>({
    nome: c.nome,
    funcao: c.funcao,
    email: c.email,
    telefone: c.telefone,
    telefone_whatsapp: c.telefone_whatsapp,
    instagram: c.instagram,
    autorizado: c.autorizado,
  });
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const alterar = <K extends keyof DadosDoCoordenador>(k: K, v: DadosDoCoordenador[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setAviso(null);
  };

  const executar = async (acao: () => Promise<{ erro: string | null }>, okTexto: string) => {
    setOcupado(true);
    setAviso(null);
    const { erro } = await acao();
    setAviso(erro ? { ok: false, texto: erro } : { ok: true, texto: okTexto });
    await onMudou();
    setOcupado(false);
  };

  return (
    <div className="border border-border rounded-sm p-3 space-y-2.5">
      <div className="flex gap-3">
        <div className="shrink-0 space-y-1 text-center">
          {c.foto_path ? (
            <FotoEvidencia
              storagePath={c.foto_path}
              alt={`Foto de ${c.nome}`}
              className="w-20 h-20 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <UserRound className="w-8 h-8" />
            </div>
          )}
          <label
            className={`inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer ${
              ocupado ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <ImagePlus className="w-3 h-3" />
            {c.foto_path ? "Trocar" : "Foto"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) executar(() => trocarFotoDoCoordenador(escolaId, c, f), "Foto guardada.");
              }}
            />
          </label>
          {c.foto_path && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => executar(() => tirarFotoDoCoordenador(c), "Foto removida.")}
              className="block mx-auto text-[11px] text-muted-foreground hover:text-destructive"
            >
              Tirar
            </button>
          )}
        </div>

        <div className="flex-1 grid sm:grid-cols-2 gap-2 min-w-0">
          <input
            value={d.nome}
            onChange={(e) => alterar("nome", e.target.value)}
            placeholder="Nome"
            aria-label="Nome"
            className={campo}
          />
          <input
            value={d.funcao ?? ""}
            onChange={(e) => alterar("funcao", e.target.value)}
            placeholder="Função — coordenador, instrutor…"
            aria-label="Função"
            className={campo}
          />
          <input
            type="email"
            value={d.email ?? ""}
            onChange={(e) => alterar("email", e.target.value)}
            placeholder="E-mail"
            aria-label="E-mail"
            className={campo}
          />
          <div>
            <input
              type="tel"
              value={d.telefone ?? ""}
              onChange={(e) => alterar("telefone", e.target.value)}
              placeholder="Telefone"
              aria-label="Telefone"
              className={campo}
            />
            <label className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={d.telefone_whatsapp}
                onChange={(e) => alterar("telefone_whatsapp", e.target.checked)}
              />
              Tem WhatsApp
            </label>
          </div>
          <input
            value={d.instagram ?? ""}
            onChange={(e) => alterar("instagram", e.target.value)}
            placeholder="Instagram — @usuario"
            aria-label="Instagram"
            className={campo}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs leading-snug">
        <input
          type="checkbox"
          checked={d.autorizado}
          onChange={(e) => alterar("autorizado", e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <strong>Esta pessoa autorizou</strong> aparecer na página pública com foto e com os
          contatos acima. Sem esta marca, nada dela é mostrado.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => executar(() => salvarCoordenador(c.id, d), "Guardado.")}
          className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {ocupado && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Guardar esta pessoa
        </button>
        <button
          type="button"
          disabled={ocupado || primeiro}
          onClick={() => onMover(-1)}
          className="p-1.5 border border-border rounded-sm hover:bg-secondary disabled:opacity-30"
          aria-label="Subir na lista"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={ocupado || ultimo}
          onClick={() => onMover(1)}
          className="p-1.5 border border-border rounded-sm hover:bg-secondary disabled:opacity-30"
          aria-label="Descer na lista"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            if (window.confirm(`Tirar ${c.nome} da coordenação? A foto é apagada.`)) {
              executar(() => apagarCoordenador(c), "Removida.");
            }
          }}
          className="ml-auto p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
          aria-label="Tirar da coordenação"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {aviso && (
          <span
            className={`w-full text-[11px] flex items-start gap-1.5 ${
              aviso.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
            }`}
          >
            {aviso.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
            {aviso.texto}
          </span>
        )}
      </div>
    </div>
  );
}
