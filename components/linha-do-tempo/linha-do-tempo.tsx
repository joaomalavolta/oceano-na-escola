import Link from "next/link";
import { MapPin, Megaphone, Route, Users } from "lucide-react";

import { IconeBadge, pinoDaOrganizacao } from "@/components/mapa/icones";
import { VideoEvidencia } from "@/components/ui/video-evidencia";
import { PedirRemocao } from "@/components/ui/pedir-remocao";
import { dataCurta, type MarcoPublicacao, type MarcoSaida, type MesNaLinha } from "@/lib/linha-do-tempo";
import { VisorDeFoto } from "./visor-de-foto";

interface Props {
  meses: MesNaLinha[];
  /**
   * Na linha da rede, cada marco diz de que escola é. Na página de uma
   * escola, repetir o nome dela em cada linha seria ruído.
   */
  mostrarEscola?: boolean;
}

/**
 * A linha do tempo desenhada: mês a mês, um marco por saída de campo ou
 * por publicação do mural.
 *
 * O traço vertical à esquerda é o tempo, e o disco em cada marco é o
 * mesmo do pino no mapa — capelo para a escola, onda para a escola de
 * surf. Quem viu o mapa reconhece a escola antes de ler o nome.
 */
export function LinhaDoTempo({ meses, mostrarEscola = true }: Props) {
  return (
    <div className="space-y-8">
      {meses.map((mes) => (
        <section key={mes.mes} aria-labelledby={`mes-${mes.mes}`}>
          <h2
            id={`mes-${mes.mes}`}
            className="text-xs font-bold uppercase tracking-wider text-primary mb-3"
          >
            {mes.rotulo}
          </h2>

          <ol className="relative border-l-2 border-border ml-3 space-y-5">
            {mes.marcos.map((m) => {
              const pino = pinoDaOrganizacao(m.escola?.tipo ?? "regular");
              return (
                <li key={m.chave} className="relative pl-6">
                  <span className="absolute -left-[13px] top-0.5">
                    <IconeBadge slug={pino.slug} cor={pino.cor} tamanho={24} className="ring-4 ring-background" />
                  </span>
                  {m.tipo === "saida" ? (
                    <CartaoSaida m={m} mostrarEscola={mostrarEscola} />
                  ) : (
                    <CartaoPublicacao m={m} mostrarEscola={mostrarEscola} />
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function NomeDaEscola({ slug, nome }: { slug: string; nome: string }) {
  return (
    <Link href={`/escola/${slug}`} className="text-sm font-semibold text-primary hover:underline">
      {nome}
    </Link>
  );
}

function CartaoSaida({ m, mostrarEscola }: { m: MarcoSaida; mostrarEscola: boolean }) {
  const x = m.expedicao;
  const lugar = [x.territorio, mostrarEscola ? m.escola?.municipio : null].filter(Boolean).join(" · ");

  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <time dateTime={m.data} className="text-sm font-bold tabular-nums">
          {dataCurta(m.data)}
        </time>
        {mostrarEscola && <NomeDaEscola slug={x.escola_slug} nome={m.escola?.nome ?? x.escola_nome} />}
        <span className="text-xs text-muted-foreground">
          Expedição #{x.numero}
          {x.titulo ? ` · ${x.titulo}` : ""}
        </span>
      </div>

      {(lugar || x.n_mapeadores !== null || x.extensao_m !== null) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {lugar && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {lugar}
            </span>
          )}
          {x.n_mapeadores !== null && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {x.n_mapeadores} mapeadores
            </span>
          )}
          {x.extensao_m !== null && (
            <span className="flex items-center gap-1">
              <Route className="w-3.5 h-3.5" />
              {x.extensao_m.toLocaleString("pt-BR")} m percorridos
            </span>
          )}
        </div>
      )}

      {m.fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {m.fotos.map((f, i) => (
            <figure key={f.id}>
              {/* O "+n" cobre só a foto, não a legenda. */}
              <div className="relative">
                <VisorDeFoto
                  evidenciaId={f.id}
                  storagePath={f.storage_path}
                  legenda={f.legenda}
                  contexto={`${m.escola?.nome ?? x.escola_nome} · expedição #${x.numero} · ${dataCurta(m.data)}`}
                  alt={f.legenda ?? `Foto da expedição #${x.numero}`}
                  className="w-full aspect-[4/3] object-cover rounded-sm"
                />
                {i === m.fotos.length - 1 && m.fotosAMais > 0 && (
                  <Link
                    href={`/escola/${x.escola_slug}`}
                    className="absolute inset-0 flex items-center justify-center rounded-sm bg-black/50 text-white text-sm font-bold"
                    aria-label={`Mais ${m.fotosAMais} fotos na página da escola`}
                  >
                    +{m.fotosAMais}
                  </Link>
                )}
              </div>
              {f.legenda && (
                <figcaption className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{f.legenda}</figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

function CartaoPublicacao({ m, mostrarEscola }: { m: MarcoPublicacao; mostrarEscola: boolean }) {
  const p = m.publicacao;
  const nome = m.escola?.nome ?? p.escola_nome;
  const fotos = m.midias.filter((x) => x.tipo === "foto_mural");
  const videos = m.midias.filter((x) => x.tipo === "video_mural");

  return (
    <article className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <time dateTime={p.publicada_em} className="text-sm font-bold tabular-nums">
          {dataCurta(m.data)}
        </time>
        {mostrarEscola && <NomeDaEscola slug={p.escola_slug} nome={nome} />}
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Megaphone className="w-3.5 h-3.5" />
          Mural
        </span>
      </div>

      {/* Texto puro, com as quebras de linha de quem escreveu. Nada de
          HTML: o texto vem de um formulário, e renderizá-lo como marcação
          abriria a página de todos os visitantes a quem escreve. */}
      <p className="text-sm leading-relaxed whitespace-pre-line break-words">{p.texto}</p>

      {videos.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-2">
          {videos.map((v) => (
            <div key={v.id} className="space-y-0.5">
              <VideoEvidencia
                storagePath={v.storage_path}
                rotulo={`Vídeo publicado por ${nome}`}
                className="w-full aspect-video rounded-sm bg-black"
              />
              <PedirRemocao evidenciaId={v.id} oQue="deste vídeo" />
            </div>
          ))}
        </div>
      )}

      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fotos.map((f) => (
            <VisorDeFoto
              key={f.id}
              evidenciaId={f.id}
              storagePath={f.storage_path}
              legenda={f.legenda}
              contexto={`${nome} · mural · ${dataCurta(m.data)}`}
              alt={f.legenda ?? `Foto publicada por ${nome}`}
              className="w-full aspect-[4/3] object-cover rounded-sm"
            />
          ))}
        </div>
      )}
    </article>
  );
}
