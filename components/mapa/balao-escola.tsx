"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Compass, MapPin, Users } from "lucide-react";

import { IconeBadge, pinoDaOrganizacao } from "./icones";
import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import { anoDe, diasLegiveis } from "@/lib/ficha-escola";
import { PROGRAMA, vocabulario } from "@/lib/organizacao";
import type { PubEscola, PubIndicadorEscola } from "@/lib/database.types";

interface Props {
  escola: PubEscola;
  indicador?: PubIndicadorEscola;
  /**
   * Para onde o balão leva. No mapa da rede, à página da escola. Na
   * página da própria escola, levar a ela mesma não faria sentido — ali
   * o balão abre a aba Sobre.
   */
  acao: { tipo: "link"; href: string; rotulo: string } | { tipo: "botao"; onClick: () => void; rotulo: string };
  /**
   * Sem a capa. Na página da própria escola ela já está no topo, e no
   * balão só o deixaria mais alto que o quadro do mapa.
   */
  semCapa?: boolean;
}

/**
 * O balão que abre sobre o pino da escola.
 *
 * Responde, sem sair do mapa, o que quem passa o mouse quer saber: que
 * escola é essa, desde quando, quando dá aula, o que já fez. Os fatos
 * que a escola não preencheu simplesmente não aparecem.
 */
export function BalaoEscola({ escola, indicador, acao, semCapa = false }: Props) {
  const v = vocabulario(escola.tipo);
  const pino = pinoDaOrganizacao(escola.tipo);
  const ano = anoDe(escola.fundada_em);
  const dias = diasLegiveis(escola.dias_aula);
  const botao =
    "mt-1 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90";

  return (
    <div className="w-64 overflow-hidden rounded-[inherit]">
      {escola.capa_path && !semCapa && (
        <FotoEvidencia
          storagePath={escola.capa_path}
          alt={`Foto de ${escola.nome}`}
          className="w-full h-28 object-cover"
        />
      )}
      <div className="p-3 space-y-2">
        {/* pr-5: o "×" do balão fica no canto de cima, por cima do nome. */}
        <div className={`flex items-start gap-2 ${escola.capa_path && !semCapa ? "" : "pr-5"}`}>
          <IconeBadge slug={pino.slug} cor={pino.cor} tamanho={24} className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">{escola.nome}</p>
            <p className="text-[11px] text-muted-foreground">
              {v.organizacao}
              {escola.tipo === "surf" && ` · ${PROGRAMA.surf}`}
            </p>
          </div>
        </div>

        <ul className="space-y-1 text-xs">
          <li className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {escola.municipio} – {escola.uf}
          </li>
          {ano && (
            <li className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              Desde {ano}
            </li>
          )}
          {(dias || escola.horario_aulas) && (
            <li className="flex items-start gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-px" />
              <span>
                {dias && <span className="first-letter:uppercase inline-block">{dias}</span>}
                {dias && escola.horario_aulas && " · "}
                {escola.horario_aulas}
              </span>
            </li>
          )}
          {escola.participantes_atendidos !== null && (
            <li className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {escola.participantes_atendidos.toLocaleString("pt-BR")} {v.rotuloAtendidos.toLowerCase()}
            </li>
          )}
          {indicador && indicador.expedicoes > 0 && (
            <li className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {indicador.expedicoes} {indicador.expedicoes === 1 ? "saída de campo" : "saídas de campo"}
              {indicador.itens_catalogados > 0 &&
                ` · ${indicador.itens_catalogados.toLocaleString("pt-BR")} itens`}
            </li>
          )}
        </ul>

        {escola.apresentacao && (
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{escola.apresentacao}</p>
        )}

        {acao.tipo === "link" ? (
          <Link href={acao.href} className={botao}>
            {acao.rotulo}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button type="button" onClick={acao.onClick} className={botao}>
            {acao.rotulo}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
