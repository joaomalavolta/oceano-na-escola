"use client";

import Link from "next/link";
import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import { IconeBadge, slugDe } from "./icones";
import type { PubObservacaoPontual, PubFotoGeorreferenciada } from "@/lib/database.types";

interface Props {
  ocorrencia: PubObservacaoPontual;
  /** A foto que documenta esta ocorrência, quando há uma publicada. */
  foto?: PubFotoGeorreferenciada;
  /** Fora da página da escola, o cartão leva até ela. */
  comLinkParaEscola?: boolean;
}

/**
 * O que se vê ao clicar num pino de ocorrência.
 *
 * Um só cartão para o mapa da rede e o da escola. Antes só o da escola
 * tinha popup, e o da rede parava na dica ao passar o mouse — que não
 * existe em celular, que é onde a maior parte das pessoas abre o mapa.
 *
 * A foto vem primeiro de propósito. O texto diz que houve descarte
 * irregular; a foto é o que faz alguém acreditar, e é o argumento que a
 * escola leva à prefeitura. Quando não há foto publicada, o cartão
 * segue inteiro — a maioria das ocorrências não terá imagem, e um
 * buraco cinza em cada uma delas seria pior que nenhum.
 */
export function PopupOcorrencia({ ocorrencia: o, foto, comLinkParaEscola }: Props) {
  const magnitude =
    o.valor !== null && o.item_unidade
      ? `${o.valor.toLocaleString("pt-BR")} ${o.item_unidade}`
      : null;

  return (
    <div className="space-y-1.5 p-0.5 max-w-[248px]">
      {foto && (
        <FotoEvidencia
          storagePath={foto.storage_path}
          alt={foto.legenda ?? o.descricao}
          className="w-full h-32 object-cover rounded-sm bg-secondary"
        />
      )}
      {foto?.legenda && (
        <p className="text-[11px] italic text-muted-foreground leading-snug">{foto.legenda}</p>
      )}

      <div className="flex items-start gap-2">
        <IconeBadge
          slug={slugDe(o.item_icone, o.protocolo_icone)}
          cor={o.protocolo_cor}
          tamanho={24}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground leading-tight">
            {o.item_nome ?? o.descricao}
          </p>
          <p className="text-[11px] text-muted-foreground">{o.protocolo_nome}</p>
        </div>
      </div>

      {magnitude && (
        <p className="text-xs tabular-nums text-accent font-semibold">{magnitude}</p>
      )}

      {o.origem_provavel && (
        <p className="text-[11px] text-muted-foreground">Origem provável: {o.origem_provavel}</p>
      )}

      <p className="text-[10px] text-muted-foreground">
        {comLinkParaEscola ? (
          <Link href={`/escola/${o.escola_slug}`} className="text-primary hover:underline">
            {o.escola_nome}
          </Link>
        ) : (
          o.escola_nome
        )}
        {" · "}
        Expedição #{o.expedicao_numero} ·{" "}
        {new Date(o.data_campo + "T00:00:00").toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}
