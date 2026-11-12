import { AtSign, CirclePlay, Globe, Link2, Mail, MessageCircle, Phone, User, Users } from "lucide-react";

import {
  linkDoInstagram,
  linkDoWhatsapp,
  temAlgumContato,
  urlValida,
  type ContatoDaEscola,
} from "@/lib/contato";

/**
 * Contato e números na aba Sobre.
 *
 * Só aparece o que a escola preencheu: nenhum "Telefone: —" para dizer
 * que não há telefone.
 *
 * Os ícones são genéricos de propósito: a biblioteca de ícones não traz
 * marca de rede social, e logotipo alheio não entra em repositório
 * público.
 *
 * Os links passam por `urlValida` de novo, embora o banco já recuse o
 * que não for http(s). É a segunda trava para o caso de um dia a
 * constraint ser afrouxada: um `href` vindo de formulário é o tipo de
 * coisa que se confere duas vezes.
 */
export function ContatoPublico({
  contato,
  rotuloAtendidos,
}: {
  contato: ContatoDaEscola | null;
  rotuloAtendidos: string;
}) {
  if (!contato || (!temAlgumContato(contato) && contato.participantes_atendidos === null)) return null;

  const c = contato;
  const whatsapp = c.contato_telefone_whatsapp ? linkDoWhatsapp(c.contato_telefone) : null;
  const seguro = (u: string | null) => (u && urlValida(u) ? u : null);
  const redes = [
    { href: seguro(c.contato_site), rotulo: c.contato_site?.replace(/^https?:\/\//, "").replace(/\/$/, ""), Icone: Globe },
    { href: linkDoInstagram(c.contato_instagram), rotulo: c.contato_instagram ? `Instagram @${c.contato_instagram}` : null, Icone: AtSign },
    { href: seguro(c.contato_facebook), rotulo: "Facebook", Icone: Link2 },
    { href: seguro(c.contato_youtube), rotulo: "YouTube", Icone: CirclePlay },
  ].filter((r) => r.href && r.rotulo);

  const linha = "flex items-center gap-2 text-sm";
  const link = "text-primary hover:underline break-all";

  return (
    <div className="grid md:grid-cols-[1fr_auto] gap-4">
      {temAlgumContato(c) && (
        <div className="bg-card border border-border rounded-md p-6 space-y-3 shadow-2xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
            Contato
          </h2>
          {c.responsavel_nome && (
            <p className={linha}>
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>
                <strong>{c.responsavel_nome}</strong>
                {c.responsavel_funcao && <span className="text-muted-foreground"> · {c.responsavel_funcao}</span>}
              </span>
            </p>
          )}
          {c.contato_email && (
            <p className={linha}>
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${c.contato_email}`} className={link}>
                {c.contato_email}
              </a>
            </p>
          )}
          {c.contato_telefone && (
            <p className={linha}>
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <a href={`tel:${c.contato_telefone.replace(/[^\d+]/g, "")}`} className={link}>
                {c.contato_telefone}
              </a>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}
            </p>
          )}
          {redes.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {redes.map(({ href, rotulo, Icone }) => (
                <a
                  key={href}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Icone className="w-4 h-4" />
                  {rotulo}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {c.participantes_atendidos !== null && (
        <div className="bg-card border border-border rounded-md p-6 shadow-2xs flex flex-col justify-center min-w-[12rem]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {rotuloAtendidos}
          </span>
          <span className="text-3xl font-bold tabular-nums mt-1">
            {c.participantes_atendidos.toLocaleString("pt-BR")}
          </span>
        </div>
      )}
    </div>
  );
}
