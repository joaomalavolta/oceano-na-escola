/**
 * Pedido de entrada na plataforma: o que o formulário público envia,
 * como se confere e como chega ao Ecosurf por e-mail.
 *
 * Só lógica pura, sem cliente do Supabase: o mesmo arquivo serve ao
 * formulário, à rota do servidor e aos testes. O banco confere tudo de
 * novo (ver a função `pedir_entrada`); aqui a conferência é para a pessoa
 * ver o problema ao preencher, e não um erro cru ao enviar.
 */

import type { Papel } from "./administracao";

export type TipoNoPedido = "regular" | "surf" | "outra";

export interface DadosDoPedido {
  nome: string;
  email: string;
  tipo: TipoNoPedido;
  papel: Exclude<Papel, "admin_ecosurf">;
  organizacao: string;
  municipio: string;
  funcao: string;
  mensagem: string;
  /** Autorização para o Ecosurf usar estes dados para responder. */
  consentimento: boolean;
  /**
   * Armadilha para robô: campo escondido de quem usa a tela. Pessoa não
   * o vê e não o preenche; robô que preenche tudo o que acha, preenche.
   */
  site: string;
}

export const PEDIDO_VAZIO: DadosDoPedido = {
  nome: "",
  email: "",
  tipo: "regular",
  papel: "professor",
  organizacao: "",
  municipio: "",
  funcao: "",
  mensagem: "",
  consentimento: false,
  site: "",
};

/** Os papéis que se podem pedir. Administração não se pede: se recebe. */
export const PAPEIS_NO_PEDIDO: { id: DadosDoPedido["papel"]; nome: string; descricao: string }[] = [
  {
    id: "professor",
    nome: "Coordenar o trabalho numa escola",
    descricao: "Professor(a) ou instrutor(a) que cadastra a escola, leva a turma a campo e publica.",
  },
  {
    id: "coordenacao_escolar",
    nome: "Coordenação escolar",
    descricao: "Acompanha as turmas de uma escola que já participa.",
  },
  {
    id: "coordenacao_municipal",
    nome: "Coordenação municipal",
    descricao: "Acompanha várias escolas de um município.",
  },
  {
    id: "pesquisador",
    nome: "Pesquisa",
    descricao: "Consulta e exporta os dados da rede.",
  },
];

export const LIMITES_DO_PEDIDO = { nome: 120, email: 200, organizacao: 160, municipio: 120, funcao: 80, mensagem: 1500 };

export function normalizarPedido(d: DadosDoPedido): DadosDoPedido {
  return {
    ...d,
    nome: d.nome.trim(),
    email: d.email.trim().toLowerCase(),
    organizacao: d.organizacao.trim(),
    municipio: d.municipio.trim(),
    funcao: d.funcao.trim(),
    mensagem: d.mensagem.trim(),
  };
}

/** Problemas por campo, em português. Vazio quando pode enviar. */
export function problemasDoPedido(d: DadosDoPedido): Partial<Record<keyof DadosDoPedido, string>> {
  const p: Partial<Record<keyof DadosDoPedido, string>> = {};
  const n = normalizarPedido(d);
  if (n.nome.length < 2) p.nome = "Escreva o seu nome.";
  else if (n.nome.length > LIMITES_DO_PEDIDO.nome) p.nome = "Nome longo demais.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(n.email) || n.email.length > LIMITES_DO_PEDIDO.email)
    p.email = "E-mail incompleto. É por ele que chega o convite.";
  if (n.organizacao.length < 2)
    p.organizacao = n.tipo === "outra" ? "Diga de onde você vem." : "Escreva o nome da escola.";
  else if (n.organizacao.length > LIMITES_DO_PEDIDO.organizacao) p.organizacao = "Nome longo demais.";
  if (n.municipio.length > LIMITES_DO_PEDIDO.municipio) p.municipio = "Nome longo demais.";
  if (n.funcao.length > LIMITES_DO_PEDIDO.funcao) p.funcao = "Texto longo demais.";
  if (n.mensagem.length > LIMITES_DO_PEDIDO.mensagem)
    p.mensagem = `Até ${LIMITES_DO_PEDIDO.mensagem} caracteres.`;
  if (!PAPEIS_NO_PEDIDO.some((x) => x.id === n.papel)) p.papel = "Escolha como quer participar.";
  if (!n.consentimento) p.consentimento = "É preciso autorizar o uso destes dados para o Ecosurf responder.";
  return p;
}

/** O banco só conhece 'regular' e 'surf'; "outra" vira nulo. */
export function tipoParaOBanco(t: TipoNoPedido): "regular" | "surf" | null {
  return t === "outra" ? null : t;
}

const ROTULO_DO_TIPO: Record<TipoNoPedido, string> = {
  regular: "Escola",
  surf: "Escola de surf",
  outra: "Outra organização",
};

export function rotuloDoTipo(t: TipoNoPedido | "regular" | "surf" | null): string {
  return ROTULO_DO_TIPO[(t ?? "outra") as TipoNoPedido];
}

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * O aviso que chega ao Ecosurf a cada pedido.
 *
 * Tudo o que veio do formulário passa por `escapar`: é texto de
 * desconhecido, e no HTML do e-mail ele só pode ser texto.
 */
export function avisoDoPedido(d: DadosDoPedido, linkDaAdministracao: string) {
  const n = normalizarPedido(d);
  const papel = PAPEIS_NO_PEDIDO.find((x) => x.id === n.papel)?.nome ?? n.papel;
  const linhas: [string, string][] = [
    ["Nome", n.nome],
    ["E-mail", n.email],
    ["Organização", `${n.organizacao} (${rotuloDoTipo(n.tipo)})`],
    ["Função", n.funcao || "—"],
    ["Município", n.municipio || "—"],
    ["Quer participar como", papel],
  ];
  const assunto = `Pedido de entrada: ${n.organizacao}`.slice(0, 140);
  const texto = [
    "Chegou um pedido de entrada na plataforma Oceano na Escola.",
    "",
    ...linhas.map(([k, v]) => `${k}: ${v}`),
    "",
    n.mensagem ? `Mensagem:\n${n.mensagem}\n` : "",
    `Para responder — convidar ou recusar —, abra a Administração: ${linkDaAdministracao}`,
  ].join("\n");
  const html = `<p>Chegou um pedido de entrada na plataforma <strong>Oceano na Escola</strong>.</p>
<table cellpadding="4" style="border-collapse:collapse;font-size:14px">
${linhas.map(([k, v]) => `<tr><td style="color:#555">${escapar(k)}</td><td><strong>${escapar(v)}</strong></td></tr>`).join("\n")}
</table>
${n.mensagem ? `<p style="white-space:pre-line;border-left:3px solid #ccc;padding-left:8px">${escapar(n.mensagem)}</p>` : ""}
<p><a href="${escapar(linkDaAdministracao)}">Abrir a Administração para convidar ou recusar</a></p>`;
  return { assunto, texto, html };
}
