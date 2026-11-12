"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";

import { carregarRankingDeMarcas, type MarcaNoRanking } from "@/lib/lixo-publico";

/**
 * As marcas mais encontradas nos pontos de Lixo no mar da rede.
 *
 * É contagem do que as escolas acharam e conseguiram ler na embalagem —
 * e o texto diz isso, porque um ranking de marcas se lê fácil como
 * acusação ou como fatia de mercado, e não é nenhuma das duas.
 */
export function RankingDeMarcas() {
  const [ranking, setRanking] = useState<MarcaNoRanking[] | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    carregarRankingDeMarcas(20).then((r) => ativo && setRanking(r));
    return () => {
      ativo = false;
    };
  }, []);

  const maior = ranking && ranking.length > 0 ? ranking[0].itens : 1;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Ranking de marcas · Lixo no mar
      </h2>
      <p className="text-xs text-muted-foreground max-w-2xl">
        Itens com marca identificada nos pontos de Lixo no mar publicados, somados por marca. É a
        contagem do que as escolas encontraram e conseguiram ler na embalagem: não mede participação
        de mercado, não diz de onde o item veio e não atribui responsabilidade a ninguém.
      </p>

      {ranking === undefined ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : ranking === null ? (
        <p className="text-xs text-destructive">Não foi possível carregar o ranking agora.</p>
      ) : ranking.length === 0 ? (
        <p className="text-xs text-muted-foreground bg-card border border-border rounded-md p-4">
          Nenhuma marca registrada em ponto publicado ainda. O ranking começa quando a primeira
          saída com Lixo no mar e marcas identificadas for publicada.
        </p>
      ) : (
        <ol className="bg-card border border-border rounded-md divide-y divide-border">
          {ranking.map((m, i) => (
            <li key={m.marca} className="flex items-center gap-3 px-4 py-2">
              <span className="w-6 text-right text-xs font-bold tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{m.marca}</p>
                <div className="h-1.5 mt-1 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(m.itens / maior) * 100}%`, backgroundColor: "#827200" }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold tabular-nums">{m.itens.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {m.pontos} ponto(s) · {m.escolas} escola(s)
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
