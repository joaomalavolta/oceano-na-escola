import { AtSign, CalendarDays, Clock, Mail, MessageCircle, Phone, UserRound, Users } from "lucide-react";

import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import { linkDoInstagram, linkDoWhatsapp } from "@/lib/contato";
import { diasLegiveis, fundacaoLegivel } from "@/lib/ficha-escola";
import type { PubCoordenador, PubEscola } from "@/lib/database.types";

/**
 * Os fatos da escola: desde quando existe, quando dá aula, quantos atende.
 * Nada aparece em branco — sem nenhum dos três, o cartão não existe.
 */
export function FuncionamentoPublico({ escola, rotuloAtendidos }: { escola: PubEscola; rotuloAtendidos: string }) {
  const fundacao = fundacaoLegivel(escola.fundada_em);
  const dias = diasLegiveis(escola.dias_aula);
  const atendidos = escola.participantes_atendidos;
  if (!fundacao && !dias && !escola.horario_aulas && atendidos === null) return null;

  const fato = "flex items-start gap-3";
  const rotulo = "block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-md p-6 shadow-2xs grid sm:grid-cols-3 gap-5">
      {fundacao && (
        <div className={fato}>
          <CalendarDays className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className={rotulo}>Fundada em</span>
            <span className="text-sm font-semibold">{fundacao}</span>
          </div>
        </div>
      )}
      {(dias || escola.horario_aulas) && (
        <div className={fato}>
          <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className={rotulo}>Aulas</span>
            {dias && <span className="text-sm font-semibold block first-letter:uppercase">{dias}</span>}
            {escola.horario_aulas && <span className="text-sm text-muted-foreground">{escola.horario_aulas}</span>}
          </div>
        </div>
      )}
      {atendidos !== null && (
        <div className={fato}>
          <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className={rotulo}>{rotuloAtendidos}</span>
            <span className="text-2xl font-bold tabular-nums">{atendidos.toLocaleString("pt-BR")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A coordenação, um cartão por pessoa, com foto redonda e contato.
 * Só vêm aqui as pessoas que a escola marcou como autorizadas — é a view
 * do banco que filtra, não esta tela.
 */
export function CoordenacaoPublica({ pessoas }: { pessoas: PubCoordenador[] }) {
  if (pessoas.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-md p-6 space-y-4 shadow-2xs">
      <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
        Coordenação
      </h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pessoas.map((p) => {
          const whatsapp = p.telefone_whatsapp ? linkDoWhatsapp(p.telefone) : null;
          const instagram = linkDoInstagram(p.instagram);
          return (
            <li key={p.id} className="flex gap-3">
              {p.foto_path ? (
                <FotoEvidencia
                  storagePath={p.foto_path}
                  alt={`Foto de ${p.nome}`}
                  className="w-16 h-16 rounded-full object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <UserRound className="w-7 h-7" />
                </div>
              )}
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-bold">{p.nome}</p>
                {p.funcao && <p className="text-xs text-muted-foreground">{p.funcao}</p>}
                <div className="pt-1 space-y-0.5 text-xs">
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-primary hover:underline break-all">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {p.email}
                    </a>
                  )}
                  {p.telefone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <a href={`tel:${p.telefone.replace(/[^\d+]/g, "")}`} className="text-primary hover:underline">
                        {p.telefone}
                      </a>
                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </span>
                  )}
                  {instagram && (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <AtSign className="w-3.5 h-3.5 shrink-0" />
                      {p.instagram}
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
