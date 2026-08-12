"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Download, Loader2, AlertTriangle, MapPin } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import {
  CONJUNTOS,
  baixarCsv,
  indicadoresPorMunicipio,
  type IndicadorMunicipio,
} from "@/lib/dados-abertos";

function numero(v: number, casas = 0): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export default function DadosPage() {
  const [municipios, setMunicipios] = useState<IndicadorMunicipio[] | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    indicadoresPorMunicipio().then((m) => ativo && setMunicipios(m));
    return () => {
      ativo = false;
    };
  }, []);

  const baixar = async (id: string) => {
    const conjunto = CONJUNTOS.find((c) => c.id === id);
    if (!conjunto) return;
    setBaixando(id);
    setErro(null);
    const { erro: falha } = await baixarCsv(conjunto);
    setBaixando(null);
    if (falha) setErro(falha);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8">
        <header className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Dados da rede
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            O que a rede publicou, em tabela e em arquivo. É exatamente o mesmo recorte do mapa:
            só expedição publicada de escola publicada, com a grade agregada em células de 100 m
            a partir de três unidades amostrais. Nada aqui identifica turma, estudante ou trecho
            exato de caminhada.
          </p>
        </header>

        {/* Indicadores por município */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Por município
          </h2>

          {municipios === null ? (
            <EstadoContainer estado="carregando" />
          ) : municipios.length === 0 ? (
            <EstadoContainer
              estado="vazio"
              mensagemVazia="Nenhum município com dado publicado ainda."
            />
          ) : (
            <div className="bg-card border border-border rounded-md overflow-x-auto shadow-2xs">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/60">
                  <tr className="border-b border-border text-left">
                    <th className="py-2.5 px-3 font-semibold">Município</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Escolas</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Expedições</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Km monitorados</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Itens catalogados</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Ocorrências</th>
                  </tr>
                </thead>
                <tbody>
                  {municipios.map((m) => (
                    <tr key={`${m.municipio}-${m.uf}`} className="border-b border-border/50">
                      <td className="py-2 px-3 font-medium">
                        {m.municipio} <span className="text-muted-foreground">— {m.uf}</span>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{m.escolas}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{m.expedicoes}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {numero(m.extensaoM / 1000, 1)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-semibold">
                        {numero(m.itens)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{m.ocorrencias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Conjuntos para download */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Baixar em CSV
          </h2>

          {erro && (
            <div className="p-3 rounded-sm text-xs flex items-start gap-2 border bg-destructive/10 border-destructive/30 text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {CONJUNTOS.map((c) => (
              <div
                key={c.id}
                className="bg-card border border-border rounded-md p-4 shadow-2xs flex flex-col gap-3"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold">{c.nome}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.descricao}</p>
                  <p className="text-[10px] font-mono text-muted-foreground pt-1">
                    {c.colunas.join(" · ")}
                  </p>
                </div>
                <button
                  onClick={() => baixar(c.id)}
                  disabled={baixando !== null}
                  className="mt-auto py-2 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {baixando === c.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Baixar CSV
                </button>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Separador ponto e vírgula, codificação UTF-8 com BOM — abre direto no Excel em
            português. Use citando <strong>Oceano na Escola / Instituto Ecosurf</strong> e a data
            de extração; o dado é produzido por estudantes em ciência cidadã e revisado pelo
            professor da escola.
          </p>
        </section>

        <footer className="border-t border-border pt-4">
          <Link href="/" className="text-xs text-primary hover:underline">
            Voltar ao mapa
          </Link>
        </footer>
      </main>
    </div>
  );
}
