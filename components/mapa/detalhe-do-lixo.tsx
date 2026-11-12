"use client";

import { useEffect, useState } from "react";

import { carregarLixoPublico, type LixoPublico } from "@/lib/lixo-publico";
import { resumoDoLixo } from "@/lib/lixo-no-mar";

/**
 * Quanto lixo, de quê e de que marca, no balão de um pino de Lixo no
 * mar. Carrega só quando o balão abre: são poucos os pinos abertos, e
 * trazer o detalhe de todos junto com o mapa pesaria a página inteira.
 */
export function DetalheDoLixo({ pontualId }: { pontualId: number }) {
  const [d, setD] = useState<LixoPublico | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarLixoPublico(pontualId).then((r) => ativo && setD(r));
    return () => {
      ativo = false;
    };
  }, [pontualId]);

  if (!d) return null;
  const resumo = resumoDoLixo(d);
  const top = <T,>(l: T[]) => l.slice(0, 3);

  return (
    <div className="space-y-1 text-[11px]">
      {resumo && <p className="font-semibold text-foreground">{resumo}</p>}
      {d.itens.length > 0 && (
        <p className="text-muted-foreground">
          {top(d.itens)
            .map((i) => `${i.nome}: ${i.quantidade}`)
            .join(" · ")}
          {d.itens.length > 3 && ` · +${d.itens.length - 3}`}
        </p>
      )}
      {d.marcas.length > 0 && (
        <p className="text-muted-foreground">
          Marcas:{" "}
          {top(d.marcas)
            .map((m) => `${m.marca} (${m.quantidade})`)
            .join(", ")}
          {d.marcas.length > 3 && ` e mais ${d.marcas.length - 3}`}
        </p>
      )}
    </div>
  );
}
