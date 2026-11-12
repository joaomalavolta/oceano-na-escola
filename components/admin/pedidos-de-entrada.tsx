"use client";

import { useState } from "react";
import { Check, Loader2, Send, X } from "lucide-react";

import { PAPEIS_NO_PEDIDO, rotuloDoTipo } from "@/lib/pedido-entrada";
import { convidarPedido, recusarPedido, type PedidoDeEntrada } from "@/lib/pedidos";

interface Props {
  pedidos: PedidoDeEntrada[];
  /** Recarrega a tela inteira: um convite novo muda também a lista de convites. */
  aoMudar: () => Promise<void>;
  avisar: (a: { tipo: "ok" | "erro"; texto: string }) => void;
  /** Mostra o link do convite recém-criado no mesmo lugar da seção de convites. */
  aoConvidar: (link: string | null, enviado: boolean, motivo: string | null) => void;
}

function quando(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * A fila de pedidos de entrada.
 *
 * Responder é convidar ou recusar. Convidar cria o convite com o papel
 * pedido — o Ecosurf ajusta papel e escola depois, se for o caso — e
 * manda o e-mail. Recusar só registra a decisão, com um motivo para a
 * equipe; a resposta à pessoa, quando houver, sai do e-mail do Ecosurf.
 */
export function PedidosDeEntrada({ pedidos, aoMudar, avisar, aoConvidar }: Props) {
  const [aberto, setAberto] = useState<{ id: number; modo: "convidar" | "recusar"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [verRespondidos, setVerRespondidos] = useState(false);

  const pendentes = pedidos.filter((p) => p.situacao === "pendente");
  const respondidos = pedidos.filter((p) => p.situacao !== "pendente");

  async function confirmar(p: PedidoDeEntrada) {
    if (!aberto) return;
    setOcupado(true);
    if (aberto.modo === "convidar") {
      const r = await convidarPedido(p, aberto.texto);
      setOcupado(false);
      if (r.erro && !r.link) {
        avisar({ tipo: "erro", texto: r.erro });
        return;
      }
      setAberto(null);
      await aoMudar();
      aoConvidar(r.link, r.enviado, r.motivo);
      avisar(
        r.erro
          ? { tipo: "erro", texto: r.erro }
          : r.enviado
            ? { tipo: "ok", texto: `Convite enviado para ${p.email}.` }
            : { tipo: "erro", texto: r.motivo ?? "O convite foi criado, mas o e-mail não saiu. Copie o link na seção de convites." }
      );
    } else {
      const { erro } = await recusarPedido(p.id, aberto.texto);
      setOcupado(false);
      if (erro) {
        avisar({ tipo: "erro", texto: erro });
        return;
      }
      setAberto(null);
      await aoMudar();
      avisar({ tipo: "ok", texto: `Pedido de ${p.nome} recusado.` });
    }
  }

  const cartao = (p: PedidoDeEntrada) => {
    const papel = PAPEIS_NO_PEDIDO.find((x) => x.id === p.papel_pretendido)?.nome ?? p.papel_pretendido;
    const esteAberto = aberto?.id === p.id ? aberto : null;
    return (
      <div key={p.id} className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold">
              {p.nome}
              {p.funcao && <span className="font-normal text-muted-foreground"> · {p.funcao}</span>}
            </p>
            <p className="text-xs">
              <a href={`mailto:${p.email}`} className="text-primary hover:underline break-all">
                {p.email}
              </a>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.organizacao} · {rotuloDoTipo(p.tipo)}
              {p.municipio && ` · ${p.municipio}`}
            </p>
          </div>
          <div className="text-[11px] text-muted-foreground sm:text-right shrink-0">
            <p>pediu em {quando(p.criado_em)}</p>
            <p>
              quer participar como <strong className="text-foreground">{papel}</strong>
            </p>
          </div>
        </div>

        {p.mensagem && (
          <p className="text-xs whitespace-pre-line border-l-2 border-border pl-3 text-foreground/90">{p.mensagem}</p>
        )}

        {p.situacao === "pendente" ? (
          esteAberto ? (
            <div className="pt-2 border-t border-border space-y-2">
              <label className="block text-[11px] font-semibold text-muted-foreground">
                {esteAberto.modo === "convidar"
                  ? "Mensagem que vai no convite (opcional)"
                  : "Motivo da recusa — fica só para a equipe do Ecosurf (opcional)"}
              </label>
              <textarea
                rows={2}
                value={esteAberto.texto}
                onChange={(e) => setAberto({ ...esteAberto, texto: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => confirmar(p)}
                  disabled={ocupado}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm inline-flex items-center gap-1 disabled:opacity-50 ${
                    esteAberto.modo === "convidar"
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive text-white"
                  }`}
                >
                  {ocupado ? <Loader2 className="w-3 h-3 animate-spin" /> : esteAberto.modo === "convidar" ? <Send className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {esteAberto.modo === "convidar" ? "Enviar convite" : "Confirmar recusa"}
                </button>
                <button
                  type="button"
                  onClick={() => setAberto(null)}
                  disabled={ocupado}
                  className="px-3 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setAberto({ id: p.id, modo: "convidar", texto: "" })}
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-sm inline-flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Convidar
              </button>
              <button
                type="button"
                onClick={() => setAberto({ id: p.id, modo: "recusar", texto: "" })}
                className="px-3 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Recusar
              </button>
              <p className="text-[11px] text-muted-foreground self-center">
                O convite sai com o papel pedido. A escola é cadastrada pela própria pessoa, e passa pela fila de análise.
              </p>
            </div>
          )
        ) : (
          <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
            {p.situacao === "convidado" ? "Convidado" : "Recusado"}
            {p.analisado_em && ` em ${quando(p.analisado_em)}`}
            {p.motivo_recusa && ` — ${p.motivo_recusa}`}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {pendentes.length === 0 ? (
        <p className="text-xs text-muted-foreground bg-card border border-border rounded-md p-4">
          Nenhum pedido esperando. Quem quer entrar na rede preenche o formulário em{" "}
          <span className="font-mono text-foreground">/pedir-entrada</span>, e o pedido aparece aqui.
        </p>
      ) : (
        pendentes.map(cartao)
      )}

      {respondidos.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setVerRespondidos((v) => !v)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {verRespondidos ? "Esconder" : "Ver"} pedidos já respondidos ({respondidos.length})
          </button>
          {verRespondidos && <div className="space-y-2 mt-2">{respondidos.map(cartao)}</div>}
        </div>
      )}
    </div>
  );
}
