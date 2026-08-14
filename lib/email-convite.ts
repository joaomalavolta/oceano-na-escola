/**
 * O e-mail do convite.
 *
 * Sem `server-only` de propósito: aqui não há credencial nenhuma, só a
 * montagem do texto, e assim os testes alcançam o arquivo.
 *
 * A regra que rege tudo neste texto: quem recebe não pediu nada. Chega
 * um link de um remetente desconhecido pedindo para criar senha — que é
 * a forma exata de um golpe. Então o e-mail diz quem manda, para que
 * serve, para qual endereço vale, até quando, e não pede nada além de
 * abrir o link. Nunca pede senha, nunca pede dado, nunca tem urgência.
 */

import type { Papel } from "./administracao";

const PAPEL_NO_CONVITE: Record<Papel, string> = {
  professor: "professor(a) responsável por uma escola",
  coordenacao_escolar: "coordenação escolar",
  coordenacao_municipal: "coordenação municipal",
  pesquisador: "pesquisador(a), com acesso de consulta e exportação",
  admin_ecosurf: "administração do Instituto Ecosurf",
};

export interface DadosDoConvite {
  para: string;
  papel: Papel;
  escolaNome: string | null;
  mensagem: string | null;
  link: string;
  expiraEm: string;
  /** Quem, no Ecosurf, está convidando. Assina o recado. */
  convidadoPor: string | null;
}

/** Impede que aspas e sinais do recado quebrem o HTML do e-mail. */
export function escaparHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dia(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function assuntoDoConvite(escolaNome: string | null): string {
  return escolaNome
    ? `Convite para o Oceano na Escola — ${escolaNome}`
    : "Convite para o Oceano na Escola";
}

export function textoDoConvite(d: DadosDoConvite): string {
  const linhas = [
    "Olá!",
    "",
    `O Instituto Ecosurf está convidando você para o Oceano na Escola, a plataforma de ciência cidadã costeira em que as escolas monitoram a praia e publicam o que encontram num mapa aberto.`,
    "",
    d.mensagem ? `"${d.mensagem}"${d.convidadoPor ? ` — ${d.convidadoPor}` : ""}` : "",
    d.mensagem ? "" : "",
    `Você entra como ${PAPEL_NO_CONVITE[d.papel]}${
      d.escolaNome ? `, já respondendo pela ${d.escolaNome}` : ""
    }.`,
    "",
    "Para aceitar, abra este endereço:",
    d.link,
    "",
    `O convite vale para ${d.para} e só funciona com esse endereço. Ele expira em ${dia(
      d.expiraEm
    )}.`,
    "",
    "Se você não esperava este convite, pode ignorar este e-mail — nada acontece sem você abrir o link. Nós nunca pedimos senha nem dados por e-mail.",
    "",
    "Instituto Ecosurf",
    "oceanonaescola@ecosurf.org.br",
  ];
  return linhas.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}

export function htmlDoConvite(d: DadosDoConvite): string {
  const e = escaparHtml;
  // Estilo em atributo, e não em folha: cliente de e-mail descarta
  // <style> com frequência, e o Gmail recorta o que sobra.
  const p = "margin:0 0 14px;font-size:15px;line-height:1.6;color:#12212f";
  const fraco = "margin:0 0 12px;font-size:13px;line-height:1.6;color:#5b6672";

  return `<div style="background:#f6f6f1;padding:24px 0">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dde3ea;border-radius:10px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="background:#014d9e;padding:18px 24px">
      <div style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-.01em">Oceano na Escola</div>
      <div style="color:#cfe3f7;font-size:12px;margin-top:2px">Instituto Ecosurf · ciência cidadã costeira</div>
    </div>

    <div style="padding:24px">
      <p style="${p}">Olá!</p>
      <p style="${p}">
        O <strong>Instituto Ecosurf</strong> está convidando você para o Oceano na Escola — a
        plataforma em que as escolas monitoram a praia e publicam o que encontram num mapa aberto.
      </p>

      ${
        d.mensagem
          ? `<blockquote style="margin:0 0 16px;padding:10px 14px;border-left:3px solid #014d9e;background:#f2f7fc;font-size:14px;line-height:1.6;color:#12212f;font-style:italic">${e(
              d.mensagem
            )}${d.convidadoPor ? `<br><span style="font-style:normal;font-size:12px;color:#5b6672">— ${e(d.convidadoPor)}</span>` : ""}</blockquote>`
          : ""
      }

      <p style="${p}">
        Você entra como <strong>${e(PAPEL_NO_CONVITE[d.papel])}</strong>${
          d.escolaNome ? `, já respondendo pela <strong>${e(d.escolaNome)}</strong>` : ""
        }.
      </p>

      <p style="margin:0 0 18px">
        <a href="${e(d.link)}" style="display:inline-block;background:#fba100;color:#1e0d01;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:4px">Aceitar o convite</a>
      </p>

      <p style="${fraco}">
        Se o botão não abrir, copie este endereço:<br>
        <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;word-break:break-all;color:#014d9e">${e(
          d.link
        )}</span>
      </p>

      <p style="${fraco}">
        O convite vale para <strong style="color:#12212f">${e(
          d.para
        )}</strong> e só funciona com esse endereço. Expira em ${dia(d.expiraEm)}.
      </p>
    </div>

    <div style="padding:14px 24px;border-top:1px solid #dde3ea;background:#fafbfc">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#5b6672">
        Não esperava este convite? Pode ignorar este e-mail — nada acontece sem você abrir o link.
        O Instituto Ecosurf <strong>nunca pede senha nem dados pessoais por e-mail</strong>.
      </p>
    </div>
  </div>
</div>`;
}
