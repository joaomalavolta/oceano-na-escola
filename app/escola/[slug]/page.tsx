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
  Award,
  BookText,
  Pencil,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { IconeBadge, slugDe } from "@/components/mapa/icones";
import { calcularConquistas } from "@/lib/conquistas";
import { listarHistoriasPublicas, type HistoriaPublica } from "@/lib/historias";
import { useSessao } from "@/lib/sessao";
import { carregarEscolaPublica, type EscolaPublica } from "@/lib/dados-escola-publica";
import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import { PedirRemocao } from "@/components/ui/pedir-remocao";

// MapLibre exige o DOM.
const MapaEscola = dynamic(
  () => import("@/components/mapa/mapa-escola").then((m) => m.MapaEscola),
  { ssr: false }
);

type Aba =
  | "sobre"
  | "mapa"
  | "expedicoes"
  | "registros"
  | "historias"
  | "galeria"
  | "conquistas";

function formatarData(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function EscolaPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { session } = useSessao();
  const [dados, setDados] = useState<EscolaPublica | null>(null);
  const [historias, setHistorias] = useState<HistoriaPublica[]>([]);
  const [historiaAberta, setHistoriaAberta] = useState<number | null>(null);
  // O mapa abre primeiro: é o centro da experiência — "o que está
  // acontecendo neste território?" — e o Sobre continua a um clique.
  const [abaAtiva, setAbaAtiva] = useState<Aba>("mapa");

  useEffect(() => {
    let ativo = true;
    carregarEscolaPublica(slug).then((d) => ativo && setDados(d));
    listarHistoriasPublicas(slug).then((h) => ativo && setHistorias(h));
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

  /**
   * As abas.
   *
   * Os rótulos são curtos porque as sete somavam mais que a largura da
   * faixa: nascia uma barra de rolagem horizontal com setas nas duas
   * pontas, e as últimas abas ficavam escondidas atrás de um gesto que
   * ninguém faz numa faixa de navegação. "Território" no lugar de "Mapa
   * do território" também evita eco com o "Mapa" da barra de cima, que é
   * outro mapa — o da rede inteira.
   *
   * A contagem sai do rótulo e vira campo próprio: assim a aba vazia
   * pode se apagar sem que o número suma, que é o que diz "aqui ainda
   * não tem nada" sem esconder a seção.
   */
  const abas: { id: Aba; label: string; contagem?: number; icon: typeof Info }[] = [
    { id: "mapa", label: "Território", icon: MapIcon },
    { id: "expedicoes", label: "Expedições", contagem: expedicoes.length, icon: Compass },
    { id: "registros", label: "Ocorrências", contagem: ocorrencias.length, icon: AlertTriangle },
    { id: "historias", label: "Histórias", contagem: historias.length, icon: BookText },
    {
      id: "galeria",
      label: "Galeria",
      contagem: galeria.length + fotos.length,
      icon: ImageIcon,
    },
    { id: "conquistas", label: "Conquistas", icon: Award },
    { id: "sobre", label: "Sobre", icon: Info },
  ];

  const conquistas = calcularConquistas(indicador, expedicoes, ocorrencias, fotos.length);

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

          {/* Só quem tem sessão vê o atalho. Quem tem sessão mas não tem
              vínculo esbarra na própria tela de edição, que explica. */}
          {session && (
            <Link
              href={`/escola/${escola.slug}/editar`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary transition-colors self-start"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar esta escola
            </Link>
          )}

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
        {/* A rolagem continua, para o celular, mas sem a barra à mostra:
            no desktop as abas cabem e o traço só sujava a faixa. */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto rolagem-invisivel">
          {abas.map(({ id, label, contagem, icon: Icon }) => {
            const ativa = abaAtiva === id;
            const vazia = contagem === 0;
            return (
              <button
                key={id}
                onClick={() => setAbaAtiva(id)}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                  ativa
                    ? "border-primary text-primary bg-primary/5"
                    : vazia
                      ? "border-transparent text-muted-foreground/50 hover:text-muted-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {contagem !== undefined && (
                  <span
                    className={`tabular-nums rounded-full px-1.5 py-px text-[10px] ${
                      ativa ? "bg-primary/15" : "bg-muted"
                    }`}
                  >
                    {contagem}
                  </span>
                )}
              </button>
            );
          })}
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
            {/* Altura pela janela, e não fixa em 550 px: num notebook de
                tela baixa aquilo passava do rodapé e a legenda abaixo
                ficava fora de vista; num monitor grande sobrava espaço
                que o mapa não usava. Os limites impedem que encolha
                demais no celular deitado. */}
            <div className="h-[62vh] min-h-[380px] max-h-[640px] border border-border rounded-md overflow-hidden relative shadow-sm">
              <MapaEscola escola={escola} ocorrencias={ocorrencias} fotos={fotos} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cada pino é uma ocorrência registrada em campo, na cor do seu protocolo.
              Clique para ver a foto, a magnitude e a expedição de origem. Troque para
              satélite no canto do mapa para ver a restinga, a foz e a drenagem.
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
                  <IconeBadge
                    slug={slugDe(o.item_icone, o.protocolo_icone)}
                    cor={o.protocolo_cor ?? "#c51d28"}
                    tamanho={30}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-semibold">
                      {o.item_nome ?? o.descricao}
                    </h3>
                    {o.valor !== null && o.item_unidade && (
                      <p className="text-sm font-bold tabular-nums text-acento-texto">
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

        {abaAtiva === "historias" && (
          <EstadoContainer
            estado={historias.length === 0 ? "vazio" : "pronto"}
            mensagemVazia="Esta escola ainda não publicou histórias do território."
          >
            <div className="space-y-3">
              {historias.map((h) => {
                const aberta = historiaAberta === h.id;
                return (
                  <article
                    key={h.id}
                    className="bg-card border border-border rounded-md overflow-hidden shadow-2xs"
                  >
                    {h.capa_storage_path && (
                      <FotoEvidencia
                        storagePath={h.capa_storage_path}
                        alt={h.titulo}
                        className="w-full h-56 object-cover"
                      />
                    )}
                    <div className="p-5 space-y-2">
                      <h3 className="text-lg font-bold leading-tight">{h.titulo}</h3>
                      {h.resumo && <p className="text-sm text-muted-foreground">{h.resumo}</p>}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {h.publicada_em && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(h.publicada_em).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {h.expedicoes.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Compass className="w-3 h-3" />
                            {/* A história aponta para o dado: os números
                                são das expedições publicadas que ela cita. */}
                            A partir das expedições{" "}
                            {h.expedicoes.map((n) => `#${n}`).join(", ")}
                          </span>
                        )}
                      </div>

                      {aberta && h.corpo.trim() !== "" && (
                        <div className="pt-2 space-y-3 border-t border-border mt-3">
                          {h.corpo
                            .split(/\n\s*\n/)
                            .filter((p) => p.trim() !== "")
                            .map((paragrafo, i) => (
                              <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
                                {paragrafo.trim()}
                              </p>
                            ))}
                        </div>
                      )}

                      {h.corpo.trim() !== "" && (
                        <button
                          onClick={() => setHistoriaAberta(aberta ? null : h.id)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {aberta ? "Fechar" : "Ler a história"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </EstadoContainer>
        )}

        {abaAtiva === "conquistas" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground max-w-2xl">
              O que esta escola construiu no próprio território. Não há classificação entre
              escolas: cada uma é medida pelo seu percurso, e o que se reconhece é a
              continuidade do monitoramento — uma saída por mês vale mais que dez num dia só.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {conquistas.map((c) => {
                const proporcao = Math.min(1, c.meta > 0 ? c.atual / c.meta : 0);
                return (
                  <div
                    key={c.id}
                    className={`bg-card border rounded-md p-4 shadow-2xs space-y-2 ${
                      c.conquistada ? "border-border" : "border-dashed border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <IconeBadge
                        slug={c.icone}
                        cor={c.cor}
                        tamanho={36}
                        className={c.conquistada ? "" : "opacity-30 saturate-0"}
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold leading-tight">{c.nome}</h3>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                          {c.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${proporcao * 100}%`,
                            backgroundColor: c.conquistada ? c.cor : "var(--color-muted-foreground)",
                          }}
                        />
                      </div>
                      <p className="text-[11px] tabular-nums text-muted-foreground">
                        {c.progresso}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
                    <FotoEvidencia
                      storagePath={f.storage_path}
                      alt={f.legenda ?? f.ocorrencia}
                      className="w-full h-48 object-cover"
                    />
                    <figcaption className="p-3 space-y-0.5">
                      <p className="text-xs font-bold">{f.item_nome ?? f.ocorrencia}</p>
                      {f.valor !== null && f.item_unidade && (
                        <p className="text-[11px] tabular-nums text-acento-texto font-semibold">
                          {f.valor.toLocaleString("pt-BR")} {f.item_unidade}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Expedição #{f.expedicao_numero} · {formatarData(f.data_campo)}
                      </p>
                      <div className="pt-1.5">
                        <PedirRemocao evidenciaId={f.id} />
                      </div>
                    </figcaption>
                  </figure>
                ))}

                {galeria.map((g) => (
                  <figure
                    key={`gal-${g.id}`}
                    className="bg-card border border-border rounded-md overflow-hidden shadow-2xs"
                  >
                    <FotoEvidencia
                      storagePath={g.storage_path}
                      alt={g.legenda ?? "Foto de campo"}
                      className="w-full h-48 object-cover"
                    />
                    <figcaption className="p-3 space-y-0.5">
                      <p className="text-xs font-bold">{g.legenda ?? "Foto de campo"}</p>
                      {g.expedicao_numero !== null && (
                        <p className="text-[11px] text-muted-foreground">
                          Expedição #{g.expedicao_numero}
                        </p>
                      )}
                      <div className="pt-1.5">
                        <PedirRemocao evidenciaId={g.id} />
                      </div>
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
