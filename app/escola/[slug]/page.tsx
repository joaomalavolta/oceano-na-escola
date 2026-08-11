"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Compass,
  ImageIcon,
  Info,
  Lock,
  Calendar,
  Users,
  Route,
  Package,
  Map as MapIcon,
  AlertTriangle,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import {
  carregarEscolaPublica,
  urlDaFoto,
  type EscolaPublica,
} from "@/lib/dados-escola-publica";

// MapLibre exige o DOM.
const MapaEscola = dynamic(
  () => import("@/components/mapa/mapa-escola").then((m) => m.MapaEscola),
  { ssr: false }
);

type Aba = "sobre" | "mapa" | "expedicoes" | "registros" | "galeria";

function formatarData(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function EscolaPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [dados, setDados] = useState<EscolaPublica | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Aba>("sobre");

  useEffect(() => {
    let ativo = true;
    carregarEscolaPublica(slug).then((d) => ativo && setDados(d));
    return () => {
      ativo = false;
    };
  }, [slug]);

  if (!dados) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BarraNavegacao />
        <main className="flex-1 flex items-center justify-center">
          <EstadoContainer estado="carregando" />
        </main>
      </div>
    );
  }

  if (!dados.disponivel || dados.erro || !dados.escola) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BarraNavegacao />
        <main className="flex-1 max-w-4xl mx-auto w-full p-8">
          <EstadoContainer
            estado="erro"
            mensagemErro={
              !dados.disponivel
                ? "Este ambiente está sem as variáveis do Supabase."
                : dados.erro ?? "Escola não encontrada na rede Oceano na Escola."
            }
          />
        </main>
      </div>
    );
  }

  const { escola, indicador, expedicoes, ocorrencias, fotos, galeria } = dados;
  const km = ((indicador?.extensao_total_m ?? 0) / 1000).toFixed(1).replace(".", ",");

  const abas: { id: Aba; label: string; icon: typeof Info }[] = [
    { id: "sobre", label: "Sobre a escola", icon: Info },
    { id: "mapa", label: "Mapa do território", icon: MapIcon },
    { id: "expedicoes", label: `Expedições (${expedicoes.length})`, icon: Compass },
    { id: "registros", label: `Ocorrências (${ocorrencias.length})`, icon: AlertTriangle },
    { id: "galeria", label: `Galeria (${galeria.length + fotos.length})`, icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      {/* Cabeçalho */}
      <div className="bg-card border-b border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {escola.municipio} – {escola.uf}
            </span>
            <h1 className="text-2xl font-bold tracking-tight">{escola.nome}</h1>
            {escola.apresentacao && (
              <p className="text-xs text-muted-foreground max-w-2xl">{escola.apresentacao}</p>
            )}
          </div>

          <div className="flex items-center gap-4 bg-secondary/80 border border-border p-4 rounded-md">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block font-semibold">
                Expedições
              </span>
              <span className="text-lg font-bold tabular-nums">
                {indicador?.expedicoes ?? 0}
              </span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block font-semibold flex items-center gap-1">
                <Route className="w-3 h-3" /> km
              </span>
              <span className="text-lg font-bold tabular-nums">{km}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block font-semibold flex items-center gap-1">
                <Package className="w-3 h-3" /> Itens
              </span>
              <span className="text-lg font-bold tabular-nums">
                {(indicador?.itens_catalogados ?? 0).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="bg-card border-b border-border sticky top-14 z-20">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {abas.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAbaAtiva(id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                abaAtiva === id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {abaAtiva === "sobre" && (
          <div className="bg-card border border-border rounded-md p-6 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
              Apresentação
            </h2>
            <p className="text-xs leading-relaxed">
              {escola.apresentacao ?? "Sem apresentação cadastrada."}
            </p>
          </div>
        )}

        {abaAtiva === "mapa" && (
          <div className="space-y-2">
            <div className="h-[550px] border border-border rounded-md overflow-hidden relative shadow-sm">
              <MapaEscola escola={escola} ocorrencias={ocorrencias} fotos={fotos} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cada pino é uma ocorrência registrada em campo, na cor do seu protocolo.
              Clique para ver a foto, a magnitude e a expedição de origem.
            </p>
          </div>
        )}

        {abaAtiva === "expedicoes" && (
          <EstadoContainer
            estado={expedicoes.length === 0 ? "vazio" : "pronto"}
            mensagemVazia="Esta escola ainda não publicou expedições."
          >
            <div className="space-y-3">
              {expedicoes.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-card border border-border rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold">
                      <span className="font-mono text-muted-foreground mr-1.5">
                        #{exp.numero}
                      </span>
                      {exp.titulo ?? "Sem título"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatarData(exp.data_campo)}
                      </span>
                      {exp.territorio && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {exp.territorio}
                        </span>
                      )}
                      {exp.n_mapeadores !== null && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {exp.n_mapeadores} mapeadores
                        </span>
                      )}
                      {exp.extensao_m !== null && (
                        <span className="flex items-center gap-1">
                          <Route className="w-3.5 h-3.5" /> {exp.extensao_m} m
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </EstadoContainer>
        )}

        {abaAtiva === "registros" && (
          <EstadoContainer
            estado={ocorrencias.length === 0 ? "vazio" : "pronto"}
            mensagemVazia="Nenhuma ocorrência publicada por esta escola ainda."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {ocorrencias.map((o) => (
                <div
                  key={o.id}
                  className="bg-card border border-border rounded-md p-4 shadow-2xs flex gap-3"
                >
                  <span
                    className="mt-1 w-3 h-3 rounded-full shrink-0 border-2 border-white shadow"
                    style={{ backgroundColor: o.protocolo_cor ?? "#a63d40" }}
                  />
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-semibold">
                      {o.item_nome ?? o.descricao}
                    </h3>
                    {o.valor !== null && o.item_unidade && (
                      <p className="text-sm font-bold tabular-nums text-accent">
                        {o.valor.toLocaleString("pt-BR")} {o.item_unidade}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">{o.protocolo_nome}</p>
                    {o.origem_provavel && (
                      <p className="text-[11px] text-muted-foreground">
                        Origem provável: {o.origem_provavel}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Expedição #{o.expedicao_numero} · {formatarData(o.data_campo)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </EstadoContainer>
        )}

        {abaAtiva === "galeria" && (
          <>
            {galeria.length + fotos.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-md text-center bg-card/60 space-y-2">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold">Nenhuma foto publicada</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  A galeria só exibe imagem com curadoria do professor e termo de uso de
                  imagem confirmado pela escola. Faltando qualquer uma das duas, a foto
                  não aparece.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fotos.map((f) => (
                  <figure
                    key={`geo-${f.id}`}
                    className="bg-card border border-border rounded-md overflow-hidden shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlDaFoto(f.storage_path)}
                      alt={f.legenda ?? f.ocorrencia}
                      className="w-full h-48 object-cover"
                    />
                    <figcaption className="p-3 space-y-0.5">
                      <p className="text-xs font-bold">{f.item_nome ?? f.ocorrencia}</p>
                      {f.valor !== null && f.item_unidade && (
                        <p className="text-[11px] tabular-nums text-accent font-semibold">
                          {f.valor.toLocaleString("pt-BR")} {f.item_unidade}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Expedição #{f.expedicao_numero} · {formatarData(f.data_campo)}
                      </p>
                    </figcaption>
                  </figure>
                ))}

                {galeria.map((g) => (
                  <figure
                    key={`gal-${g.id}`}
                    className="bg-card border border-border rounded-md overflow-hidden shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlDaFoto(g.storage_path)}
                      alt={g.legenda ?? "Foto de campo"}
                      className="w-full h-48 object-cover"
                    />
                    <figcaption className="p-3">
                      <p className="text-xs font-bold">{g.legenda ?? "Foto de campo"}</p>
                      {g.expedicao_numero !== null && (
                        <p className="text-[11px] text-muted-foreground">
                          Expedição #{g.expedicao_numero}
                        </p>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border py-4 text-center">
        <Link href="/escolas" className="text-xs text-primary hover:underline">
          Ver todas as escolas da rede
        </Link>
      </footer>
    </div>
  );
}
