import "server-only";

import nodemailer from "nodemailer";

/**
 * Envio de e-mail da plataforma.
 *
 * Só roda no servidor: a credencial do remetente não pode chegar ao
 * navegador de ninguém, e o `server-only` faz o build quebrar se alguém
 * importar isto de um componente de cliente por engano.
 *
 * Dois caminhos, escolhidos pelo ambiente, porque a resposta certa
 * depende de o Ecosurf já ter ou não uma caixa no domínio:
 *
 *   SMTP     — usa a caixa que já existe (Google Workspace, Zoho,
 *              cPanel). Não mexe em DNS: a entregabilidade é a que o
 *              domínio já tem. É o caminho mais curto para começar.
 *   Resend   — serviço transacional. Exige verificar o domínio por
 *              SPF e DKIM, e em troca dá relatório de entrega e não
 *              depende de senha de caixa.
 *
 * Nenhum dos dois configurado é situação prevista, não é defeito: o
 * convite continua sendo criado e o link continua aparecendo na tela
 * para o Ecosurf mandar à mão. E-mail que não sai nunca pode custar o
 * convite.
 */

export const REMETENTE_EMAIL = "oceanonaescola@ecosurf.org.br";
export const REMETENTE_NOME = "Oceano na Escola · Instituto Ecosurf";

export interface Recado {
  para: string;
  assunto: string;
  html: string;
  texto: string;
}

export interface ResultadoEnvio {
  enviado: boolean;
  /** Por que não saiu, em português, para a tela do Ecosurf. */
  motivo: string | null;
}

/** Qual caminho está configurado, ou nenhum. */
export function meioDeEnvio(): "smtp" | "resend" | null {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  if (process.env.RESEND_API_KEY) return "resend";
  return null;
}

async function porSmtp(r: Recado): Promise<ResultadoEnvio> {
  const porta = Number(process.env.SMTP_PORT ?? 587);
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    // 465 é TLS desde o primeiro byte; 587 abre em claro e sobe para
    // TLS com STARTTLS. Errar isto dá "connection timeout" sem dizer
    // por quê, que é dos erros mais caros de diagnosticar aqui.
    secure: porta === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporte.sendMail({
    from: `"${REMETENTE_NOME}" <${process.env.SMTP_FROM ?? REMETENTE_EMAIL}>`,
    to: r.para,
    subject: r.assunto,
    text: r.texto,
    html: r.html,
  });

  return { enviado: true, motivo: null };
}

async function porResend(r: Recado): Promise<ResultadoEnvio> {
  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${REMETENTE_NOME} <${process.env.RESEND_FROM ?? REMETENTE_EMAIL}>`,
      to: [r.para],
      subject: r.assunto,
      html: r.html,
      text: r.texto,
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    // O corpo do Resend costuma trazer o motivo real — domínio não
    // verificado, remetente recusado. Vale mais que o número do status.
    return {
      enviado: false,
      motivo: `O serviço de e-mail recusou o envio (${resposta.status}): ${corpo.slice(0, 300)}`,
    };
  }

  return { enviado: true, motivo: null };
}

/**
 * Manda o recado. Nunca lança: quem chama não pode perder o trabalho
 * feito só porque o e-mail não saiu.
 */
export async function enviarEmail(r: Recado): Promise<ResultadoEnvio> {
  const meio = meioDeEnvio();

  if (meio === null) {
    return {
      enviado: false,
      motivo:
        "O envio de e-mail ainda não está configurado neste ambiente. O convite foi criado e o link está aqui para você mandar.",
    };
  }

  try {
    return meio === "smtp" ? await porSmtp(r) : await porResend(r);
  } catch (err) {
    const detalhe = err instanceof Error ? err.message : String(err);
    return {
      enviado: false,
      // A mensagem crua entra, e de propósito: "Invalid login" e
      // "getaddrinfo ENOTFOUND" dizem coisas diferentes a quem vai
      // arrumar, e esconder isso atrás de "falha no envio" faria o
      // Ecosurf abrir um chamado para descobrir o que já estava escrito.
      motivo: `Não consegui enviar o e-mail: ${detalhe}. O convite foi criado e o link continua valendo.`,
    };
  }
}
