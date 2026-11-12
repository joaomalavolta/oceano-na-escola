"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";

import { CartaoEscola } from "@/components/escolas/cartao-escola";
import { carregarDadosPublicos, type DadosPublicos } from "@/lib/dados-publicos";

/**
 * As escolas de surf publicadas, dentro da página do programa.
 *
 * Sem nenhuma, a seção não some: diz que ainda não há. Uma página de
 * programa que esconde a lista vazia parece ter participantes que não
 * mostra — e a primeira escola de surf a se cadastrar precisa saber que
 * é a primeira.
 */
export function EscolasDeSurf() {
  const [dados, setDados] = useState<DadosPublicos | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarDadosPublicos()
      .then((d) => ativo && setDados(d))
      // Falha de rede aqui não derruba a página: a seção cai no estado
      // de lista vazia, e o resto do conteúdo não depende do banco.
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);

  if (!dados) {
    return <p className="text-xs text-muted-foreground">Carregando as escolas de surf…</p>;
  }

  const lista = dados.escolas.filter((e) => e.tipo === "surf");

  if (lista.length === 0) {
    return (
      <p className="text-sm text-muted-foreground bg-card border border-border rounded-md p-4">
        Ainda não há escola de surf publicada na rede. O programa está começando, e a primeira a
        se cadastrar abre o mapa dos Guardiões.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {dados.origem === "mock" && (
        <p className="text-[11px] text-muted-foreground">
          Dados de demonstração: a escola abaixo é fictícia.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {lista.map((escola) => (
          <CartaoEscola
            key={escola.slug}
            escola={escola}
            indicador={dados.indicadoresEscola.find((i) => i.escola_slug === escola.slug)}
          />
        ))}
      </div>
      <Link
        href="/?rede=surf"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <MapIcon className="w-3.5 h-3.5" />
        Ver os Guardiões no mapa
      </Link>
    </div>
  );
}
