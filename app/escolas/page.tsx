"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { School, Waves, ArrowRight } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { CartaoEscola } from "@/components/escolas/cartao-escola";
import { carregarDadosPublicos, type DadosPublicos } from "@/lib/dados-publicos";
import { PROGRAMA, redeDaUrl, vocabulario, type TipoOrganizacao } from "@/lib/organizacao";

/**
 * Índice público da rede.
 *
 * Lê pub_escola e pub_indicador_escola, as mesmas views do mapa. Só
 * aparece escola publicada — a view já filtra por `publicada = true`,
 * e o visitante sem login não alcança as tabelas base.
 *
 * Duas abas, e não duas páginas nem um item novo no menu: escola e
 * escola de surf são a mesma rede, monitorando o mesmo litoral. A aba é
 * um endereço (`?rede=surf`), para que a página dos Guardiões possa
 * apontar direto para ela e o botão de voltar do navegador funcione.
 */
function Conteudo() {
  const params = useSearchParams();
  // Sem parâmetro, ou com um desconhecido, a aba é a das escolas.
  const aba: TipoOrganizacao = redeDaUrl(params.get("rede")) || "regular";

  const [dados, setDados] = useState<DadosPublicos | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarDadosPublicos()
      .then((d) => ativo && setDados(d))
      .catch(() => ativo && setErro(true));
    return () => {
      ativo = false;
    };
  }, []);

  const total = (tipo: TipoOrganizacao) =>
    dados?.escolas.filter((e) => e.tipo === tipo).length ?? 0;
  const lista = dados?.escolas.filter((e) => e.tipo === aba) ?? [];

  const estado = erro ? "erro" : !dados ? "carregando" : lista.length === 0 ? "vazio" : "pronto";
  const surf = aba === "surf";

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          {surf ? (
            <Waves className="w-6 h-6 text-primary" />
          ) : (
            <School className="w-6 h-6 text-primary" />
          )}
          {surf ? "Escolas de surf da rede" : "Escolas da rede"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {surf
            ? "As escolas de surf participam pelo programa Guardiões Ecosurf, com o mesmo método e no mesmo mapa das escolas."
            : "Cada escola atua como núcleo local, e os estudantes como mapeadores do próprio território."}
        </p>
      </header>

      <nav aria-label="Tipo de organização" className="flex border-b border-border mb-5">
        {(["regular", "surf"] as const).map((t) => {
          const ativa = aba === t;
          return (
            <Link
              key={t}
              href={t === "surf" ? "/escolas?rede=surf" : "/escolas"}
              aria-current={ativa ? "page" : undefined}
              className={`px-3 py-2 text-sm font-semibold transition-colors -mb-px border-b-2 ${
                ativa
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {vocabulario(t).organizacoes}
              {dados && (
                <span className="ml-1.5 text-xs font-normal tabular-nums text-muted-foreground">
                  {total(t)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {surf && (
        <Link
          href="/guardioes"
          className="group flex items-center gap-3 bg-card border border-border rounded-md p-4 mb-5 hover:border-primary transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{PROGRAMA.surf}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              O que as escolas de surf observam, como funciona e como participar.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      <EstadoContainer
        estado={estado}
        mensagemVazia={
          surf
            ? "Nenhuma escola de surf publicada ainda."
            : "Nenhuma escola publicada ainda."
        }
        mensagemErro="Não foi possível carregar as escolas."
        onTentarNovamente={() => window.location.reload()}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {lista.map((escola) => (
            <CartaoEscola
              key={escola.slug}
              escola={escola}
              indicador={dados?.indicadoresEscola.find((i) => i.escola_slug === escola.slug)}
            />
          ))}
        </div>
      </EstadoContainer>
    </main>
  );
}

export default function EscolasPage() {
  return (
    <div className="min-h-screen bg-background">
      <BarraNavegacao />
      {/* `useSearchParams` exige um limite de Suspense para a página
          poder ser pré-renderizada. */}
      <Suspense fallback={null}>
        <Conteudo />
      </Suspense>
    </div>
  );
}
