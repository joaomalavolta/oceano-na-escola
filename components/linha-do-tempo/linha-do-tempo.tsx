import Link from "next/link";
import { MapPin, Route, Users } from "lucide-react";

import { IconeBadge, pinoDaOrganizacao } from "@/components/mapa/icones";
import { VisorDeFoto } from "./visor-de-foto";
import { dataCurta, type MesNaLinha } from "@/lib/linha-do-tempo";

interface Props {
  meses: MesNaLinha[];
  /**
   * Na linha da rede, cada saída diz de que escola é. Na página de uma
   * escola, repetir o nome dela em cada linha seria ruído.
   */
  mostrarEscola?: boolean;
}

/**
 * A linha do tempo desenhada: mês a mês, uma saída por marco, com as
 * fotos que a escola publicou daquela saída.
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
            className="text-xs font-bold uppercase tracking-wider text-primary mb-3 first-letter:uppercase"
          >
            {mes.rotulo}
          </h2>

          <ol className="relative border-l-2 border-border ml-3 space-y-5">
            {mes.marcos.map((m) => {
              const pino = pinoDaOrganizacao(m.escola?.tipo ?? "regular");
              const x = m.expedicao;
              return (
                <li key={m.chave} className="relative pl-6">
                  <span className="absolute -left-[13px] top-0.5">
                    <IconeBadge slug={pino.slug} cor={pino.cor} tamanho={24} className="ring-4 ring-background" />
                  </span>

                  <div className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <time dateTime={m.data} className="text-sm font-bold tabular-nums">
                        {dataCurta(m.data)}
                      </time>
                      {mostrarEscola && (
                        <Link
                          href={`/escola/${x.escola_slug}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {m.escola?.nome ?? x.escola_nome}
                        </Link>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Expedição #{x.numero}
                        {x.titulo ? ` · ${x.titulo}` : ""}
                      </span>
                    </div>

                    {(x.territorio || x.n_mapeadores !== null || x.extensao_m !== null || (mostrarEscola && m.escola)) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {(x.territorio || (mostrarEscola && m.escola)) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {[x.territorio, mostrarEscola ? m.escola?.municipio : null]
                              .filter(Boolean)
                              .join(" · ")}
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
                              <figcaption className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                {f.legenda}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
