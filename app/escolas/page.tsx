"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { School, MapPin, Compass, Route, Package } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { carregarDadosPublicos, type DadosPublicos } from "@/lib/dados-publicos";

/**
 * Índice público da rede.
 *
 * Lê pub_escola e pub_indicador_escola, as mesmas views do mapa. Só
 * aparece escola publicada — a view já filtra por `publicada = true`,
 * e o visitante sem login não alcança as tabelas base.
 */
export default function EscolasPage() {
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

  const estado = erro ? "erro" : !dados ? "carregando" : dados.escolas.length === 0 ? "vazio" : "pronto";

  return (
    <div className="min-h-screen bg-background">
      <BarraNavegacao />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <School className="w-6 h-6 text-primary" />
            Escolas da rede
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada escola atua como núcleo local, e os estudantes como mapeadores do
            próprio território.
          </p>
        </header>

        <EstadoContainer
          estado={estado}
          mensagemVazia="Nenhuma escola publicada ainda."
          mensagemErro="Não foi possível carregar as escolas."
          onTentarNovamente={() => window.location.reload()}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {dados?.escolas.map((escola) => {
              const ind = dados.indicadoresEscola.find(
                (i) => i.escola_slug === escola.slug
              );
              return (
                <Link
                  key={escola.slug}
                  href={`/escola/${escola.slug}`}
                  className="block bg-card border border-border rounded-md p-4 hover:border-primary transition-colors"
                >
                  <h2 className="font-semibold text-foreground">{escola.nome}</h2>

                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {escola.municipio} · {escola.uf}
                  </p>

                  {escola.apresentacao && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {escola.apresentacao}
                    </p>
                  )}

                  <dl className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Compass className="w-3 h-3" />
                      <dd className="font-semibold text-foreground">
                        {ind?.expedicoes ?? 0}
                      </dd>
                      <dt>expedições</dt>
                    </div>
                    <div className="flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      <dd className="font-semibold text-foreground">
                        {((ind?.extensao_total_m ?? 0) / 1000).toFixed(1).replace(".", ",")}
                      </dd>
                      <dt>km</dt>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <dd className="font-semibold text-foreground">
                        {(ind?.itens_catalogados ?? 0).toLocaleString("pt-BR")}
                      </dd>
                      <dt>itens</dt>
                    </div>
                  </dl>
                </Link>
              );
            })}
          </div>
        </EstadoContainer>
      </main>
    </div>
  );
}
