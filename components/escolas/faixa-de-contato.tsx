import { AtSign, ChevronRight, Globe, Mail, MessageCircle, Phone, UserRound } from "lucide-react";

import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import { linkDoInstagram, linkDoWhatsapp, urlValida, type ContatoDaEscola } from "@/lib/contato";
import type { PubCoordenador } from "@/lib/database.types";

interface Props {
  coordenadores: PubCoordenador[];
  contato: ContatoDaEscola | null;
  /** Leva à aba Sobre, onde está tudo por extenso. */
  onVerSobre: () => void;
}

/** Quantas pessoas cabem na faixa antes de virar "+n". */
const PESSOAS_NA_FAIXA = 3;

/**
 * Quem coordena e como falar com a escola, no topo da página.
 *
 * A aba Sobre tem tudo por extenso, mas era a última da fila: quem
 * chegava querendo matricular o filho ou propor uma parceria precisava
 * achar a aba antes de achar o telefone. Aqui ficam o rosto de quem
 * coordena e os botões diretos — o resto continua no Sobre.
 *
 * Só aparece o que a escola preencheu. Sem coordenação autorizada e sem
 * contato, a faixa não existe.
 */
export function FaixaDeContato({ coordenadores, contato, onVerSobre }: Props) {
  const c = contato;
  const seguro = (u: string | null | undefined) => (u && urlValida(u) ? u : null);

  const whatsapp = c?.contato_telefone_whatsapp ? linkDoWhatsapp(c.contato_telefone) : null;
  const botoes = [
    whatsapp && { href: whatsapp, rotulo: "WhatsApp", Icone: MessageCircle, externo: true, destaque: true },
    !whatsapp && c?.contato_telefone && {
      href: `tel:${c.contato_telefone.replace(/[^\d+]/g, "")}`,
      rotulo: c.contato_telefone,
      Icone: Phone,
      externo: false,
      destaque: false,
    },
    c?.contato_email && { href: `mailto:${c.contato_email}`, rotulo: "E-mail", Icone: Mail, externo: false, destaque: false },
    c?.contato_instagram && {
      href: linkDoInstagram(c.contato_instagram)!,
      rotulo: "Instagram",
      Icone: AtSign,
      externo: true,
      destaque: false,
    },
    seguro(c?.contato_site) && { href: seguro(c?.contato_site)!, rotulo: "Site", Icone: Globe, externo: true, destaque: false },
  ].filter(Boolean) as { href: string; rotulo: string; Icone: typeof Mail; externo: boolean; destaque: boolean }[];

  if (coordenadores.length === 0 && botoes.length === 0) return null;

  const visiveis = coordenadores.slice(0, PESSOAS_NA_FAIXA);
  const aMais = coordenadores.length - visiveis.length;

  return (
    <div className="max-w-6xl mx-auto mt-6 pt-5 border-t border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {visiveis.length > 0 && (
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-3" aria-label="Coordenação">
          {visiveis.map((p) => {
            const zap = p.telefone_whatsapp ? linkDoWhatsapp(p.telefone) : null;
            const insta = linkDoInstagram(p.instagram);
            return (
              <li key={p.id} className="flex items-center gap-3 min-w-0">
                {p.foto_path ? (
                  <FotoEvidencia
                    storagePath={p.foto_path}
                    alt={`Foto de ${p.nome}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-background ring-1 ring-border shrink-0"
                  />
                ) : (
                  <span className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <UserRound className="w-6 h-6" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight">{p.nome}</p>
                  {p.funcao && <p className="text-[11px] text-muted-foreground">{p.funcao}</p>}
                  {/* Os contatos da pessoa, só como ícones: a faixa é para
                      reconhecer quem é e chamar, não para ler endereços. */}
                  <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="hover:text-primary" aria-label={`E-mail de ${p.nome}`} title={p.email}>
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {zap && (
                      <a
                        href={zap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-600"
                        aria-label={`WhatsApp de ${p.nome}`}
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!zap && p.telefone && (
                      <a
                        href={`tel:${p.telefone.replace(/[^\d+]/g, "")}`}
                        className="hover:text-primary"
                        aria-label={`Telefone de ${p.nome}`}
                        title={p.telefone}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {insta && (
                      <a
                        href={insta}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                        aria-label={`Instagram de ${p.nome}`}
                        title={`@${p.instagram}`}
                      >
                        <AtSign className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {aMais > 0 && (
            <li>
              <button type="button" onClick={onVerSobre} className="text-xs font-semibold text-primary hover:underline">
                +{aMais} na coordenação
              </button>
            </li>
          )}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {botoes.map(({ href, rotulo, Icone, externo, destaque }) => (
          <a
            key={href}
            href={href}
            {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              destaque
                ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                : "border-border hover:bg-secondary"
            }`}
          >
            <Icone className="w-3.5 h-3.5" />
            {rotulo}
          </a>
        ))}
        <button
          type="button"
          onClick={onVerSobre}
          className="inline-flex items-center gap-0.5 px-2 py-1.5 text-xs font-semibold text-primary hover:underline"
        >
          Mais sobre a escola
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
