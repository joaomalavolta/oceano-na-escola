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
import { SeloTipo } from "@/components/escolas/selo-tipo";
import { LinhaDoTempo } from "@/components/linha-do-tempo/linha-do-tempo";
import { EscreverNoMural } from "@/components/mural/escrever-no-mural";
import { ContatoPublico } from "@/components/escolas/contato-publico";
import { FaixaDeContato } from "@/components/escolas/faixa-de-contato";
import { CoordenacaoPublica, FuncionamentoPublico } from "@/components/escolas/sobre-a-escola";
import { possoEscreverNoMural } from "@/lib/mural";
import { vocabulario, maiuscula } from "@/lib/organizacao";
import { montarLinhaDoTempo, recortarLinha } from "@/lib/linha-do-tempo";
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

const ATIVIDADES_NO_TERRITORIO = 3;

/** O que a foto é, quando ela não tem legenda. */
function rotuloDaFoto(tipo: string): string {
  if (tipo === "capa_escola") return "Foto de capa";
  if (tipo === "foto_turma") return "A turma";
  return "Foto de campo";
}

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
  // Sobe a cada publicação no mural, para a página recarregar e mostrar
  // a publicação nova sem a pessoa precisar atualizar o navegador.
  const [versao, setVersao] = useState(0);
  const [podeEscrever, setPodeEscrever] = useState(false);

  useEffect(() => {
    let ativo = true;
    carregarEscolaPublica(slug).then((d) => ativo && setDados(d));
    listarHistoriasPublicas(slug).then((h) => ativo && setHistorias(h));
    return () => {
      ativo = false;
    };
  }, [slug, versao]);

  // O campo de escrever só aparece para quem responde pela escola. É o
  // banco quem decide, pela mesma função das políticas de acesso: mostrar
  // o campo a quem não pode publicar seria convidar a um erro.
  const escolaId = dados?.escola?.id ?? null;
  useEffect(() => {
    let ativo = true;
    if (!session || escolaId === null) {
      Promise.resolve(false).then((v) => ativo && setPodeEscrever(v));
    } else {
      possoEscreverNoMural(escolaId).then((v) => ativo && setPodeEscrever(v));
    }
    return () => {
      ativo = false;
    };
  }, [session, escolaId]);

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

  const { escola, indicador, expedicoes, ocorrencias, fotos, galeria, contato, publicacoes, midias, coordenadores } =
    dados;
  const v = vocabulario(escola.tipo);
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
    // "Atividades" e não "Expedições": além das saídas de campo, a aba
    // traz o mural da escola, na ordem do tempo. E não "Linha do tempo",
    // que é mais longo: as abas já ocupam quase toda a faixa, e quatro
    // letras a mais empurravam a última para trás da rolagem.
    { id: "expedicoes", label: "Atividades", contagem: expedicoes.length + publicacoes.length, icon: Compass },
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

  const linhaDaEscola = montarLinhaDoTempo({
    expedicoes,
    fotos: galeria,
    publicacoes,
    midias,
    escolas: [{ slug: escola.slug, nome: escola.nome, tipo: escola.tipo, municipio: escola.municipio }],
    // Na página da própria escola cabem mais fotos por saída: aqui ela
    // é o assunto, e não uma entre várias.
    fotosPorMarco: 8,
  });

  // Embaixo do mapa, só as mais recentes: a aba Território é o mapa, e
  // uma linha do tempo inteira ali empurraria o rodapé para longe.
  const totalDeAtividades = linhaDaEscola.reduce((n, m) => n + m.marcos.length, 0);
  const linhaRecente = recortarLinha(linhaDaEscola, ATIVIDADES_NO_TERRITORIO);

  const conquistas = calcularConquistas(indicador, expedicoes, ocorrencias, fotos.length);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      {/* Cabeçalho */}
      <div className="bg-card border-b border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
          {escola.capa_path && (
            <FotoEvidencia
              storagePath={escola.capa_path}
              alt={`Foto de ${escola.nome}`}
              className="w-full sm:w-56 h-40 sm:h-36 object-cover rounded-md border border-border shrink-0"
            />
          )}
          <div className="space-y-2 min-w-0">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {escola.municipio} – {escola.uf}
            </span>
            <h1 className="text-2xl font-bold tracking-tight">{escola.nome}</h1>
            <SeloTipo tipo={escola.tipo} comPrograma className="!text-[11px]" />
            {escola.apresentacao && (
              <p className="text-xs text-muted-foreground max-w-2xl">{escola.apresentacao}</p>
            )}
          </div>
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

        {/* Quem coordena e como falar com a escola, antes das abas. */}
        <FaixaDeContato
          coordenadores={coordenadores}
          contato={contato}
          onVerSobre={() => {
            setAbaAtiva("sobre");
            document.getElementById("abas-da-escola")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>

      {/* Abas */}
      <div id="abas-da-escola" className="bg-card border-b border-border sticky top-14 z-20 scroll-mt-14">
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
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-md p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
                Apresentação
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {escola.apresentacao ?? "Sem apresentação cadastrada."}
              </p>
            </div>
            <FuncionamentoPublico escola={escola} rotuloAtendidos={v.rotuloAtendidos} />
            <CoordenacaoPublica pessoas={coordenadores} />
            <ContatoPublico contato={contato} />
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
              <MapaEscola
                escola={escola}
                ocorrencias={ocorrencias}
                fotos={fotos}
                indicador={indicador ?? undefined}
                onVerSobre={() => {
                  setAbaAtiva("sobre");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Passe o mouse no pino d{v.aOrganizacao} para ver o resumo dela. Os outros pinos
              são ocorrências registradas em campo, na cor do seu protocolo: clique para ver a
              foto, a magnitude e a expedição de origem. Troque para satélite no canto do mapa
              para ver a restinga, a foz e a drenagem.
            </p>

            {/* As atividades logo abaixo do mapa: quem chega à página
                abre aqui, e vê o território e o que a escola tem feito
                nele sem precisar trocar de aba. Mostra as mais recentes;
                a lista inteira, e o campo do mural, estão em Atividades. */}
            {linhaRecente.length > 0 && (
              <section className="pt-6 space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                    Atividades recentes
                  </h2>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva("expedicoes")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver todas{totalDeAtividades > ATIVIDADES_NO_TERRITORIO ? ` (${totalDeAtividades})` : ""}
                  </button>
                </div>
                <LinhaDoTempo meses={linhaRecente} mostrarEscola={false} />
              </section>
            )}
          </div>
        )}

        {abaAtiva === "expedicoes" && (
          <div className="space-y-6">
            {podeEscrever && (
              <div className="space-y-1.5">
                <EscreverNoMural
                  escolaId={escola.id}
                  aOrganizacao={v.aOrganizacao}
                  onPublicado={() => setVersao((n) => n + 1)}
                />
                <Link
                  href={`/escola/${escola.slug}/editar#mural`}
                  className="text-[11px] text-primary hover:underline"
                >
                  Tirar do ar ou apagar publicações, na ficha d{v.aOrganizacao}
                </Link>
              </div>
            )}
            <EstadoContainer
              estado={expedicoes.length + publicacoes.length === 0 ? "vazio" : "pronto"}
              mensagemVazia={`${maiuscula(v.aOrganizacao)} ainda não publicou saídas de campo nem publicações no mural.`}
            >
              {/* A linha do tempo da escola: a mesma da rede, recortada.
                  Saídas de campo e mural juntos, pela data. */}
              <LinhaDoTempo meses={linhaDaEscola} mostrarEscola={false} />
              <p className="text-xs text-muted-foreground mt-6">
                Veja também o que as outras escolas estão fazendo na{" "}
                <Link href="/linha-do-tempo" className="text-primary hover:underline">
                  linha do tempo da rede
                </Link>
                .
              </p>
            </EstadoContainer>
          </div>
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
                      alt={g.legenda ?? rotuloDaFoto(g.tipo)}
                      className="w-full h-48 object-cover"
                    />
                    <figcaption className="p-3 space-y-0.5">
                      <p className="text-xs font-bold">{g.legenda ?? rotuloDaFoto(g.tipo)}</p>
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
