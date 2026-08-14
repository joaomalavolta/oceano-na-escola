/**
 * Convites da plataforma.
 *
 * A segunda porta de entrada. Na primeira a pessoa chega sozinha e o
 * Ecosurf decide depois — é a fila de análise da escola. Aqui o Ecosurf
 * decide antes e vai buscar quem quer, e por isso o convite já carrega
 * o papel e, quando faz sentido, o vínculo com uma escola existente.
 *
 * Quem entra por convite não passa pela fila: o convite é a aprovação,
 * dada de antemão.
 *
 * Nada nesta camada é permissão. Criar, revogar e resgatar são funções
 * com definer no banco, e é lá que se confere quem está chamando e se o
 * e-mail da sessão é o do convite.
 */

import { supabase } from "./supabase";
import type { Papel } from "./administracao";

export interface Convite {
  id: number;
  email: string;
  papel: Papel;
  escola_id: number | null;
  escola_nome: string | null;
  token: string;
  mensagem: string | null;
  criado_em: string;
  expira_em: string;
  resgatado_em: string | null;
  revogado_em: string | null;
}

/** Como o convite se apresenta a quem ainda não entrou. */
export interface ConviteAberto {
  emailMascarado: string;
  papel: Papel;
  escolaNome: string | null;
  mensagem: string | null;
  expiraEm: string;
  situacao: "aberto" | "expirado" | "revogado" | "resgatado";
}

export type SituacaoConvite = ConviteAberto["situacao"];

/** A chave onde o token espera a sessão aparecer. */
export const CHAVE_CONVITE = "oceano.convite.token";

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ── Lado do Ecosurf ───────────────────────────────────────────────────

export async function listarConvites(): Promise<Convite[]> {
  const { data, error } = await supabase
    .from("convite")
    .select(
      "id, email, papel, escola_id, token, mensagem, criado_em, expira_em, resgatado_em, revogado_em, escola:escola_id (nome)"
    )
    .order("criado_em", { ascending: false });

  if (error) return [];

  type E = { nome: string } | { nome: string }[] | null;
  return (data ?? []).map((c) => {
    const e = Array.isArray(c.escola) ? c.escola[0] : (c.escola as E);
    return {
      id: num(c.id),
      email: String(c.email),
      papel: String(c.papel) as Papel,
      escola_id: c.escola_id === null ? null : num(c.escola_id),
      escola_nome: e && !Array.isArray(e) ? String(e.nome) : null,
      token: String(c.token),
      mensagem: c.mensagem ?? null,
      criado_em: String(c.criado_em),
      expira_em: String(c.expira_em),
      resgatado_em: c.resgatado_em ?? null,
      revogado_em: c.revogado_em ?? null,
    };
  });
}

export interface ConviteCriado {
  link: string | null;
  /** O e-mail saiu? Falso não é erro: o link continua valendo. */
  enviado: boolean;
  /** Por que não saiu, quando não saiu. */
  motivo: string | null;
  erro: string | null;
}

/**
 * Cria o convite e pede o envio do e-mail.
 *
 * Passa por uma rota no servidor, e não direto pelo RPC, porque a
 * credencial do remetente não pode existir no navegador. Quem decide se
 * pode convidar continua sendo o banco: a rota chama a mesma função com
 * o token desta sessão.
 *
 * O e-mail falhar não é o convite falhar. A rota devolve o link de
 * qualquer jeito, e a tela mostra o motivo junto — assim o Ecosurf
 * manda à mão hoje e arruma o envio quando puder.
 */
export async function criarConvite(
  email: string,
  papel: Papel,
  escolaId: number | null,
  mensagem: string,
  dias: number
): Promise<ConviteCriado> {
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) {
    return { link: null, enviado: false, motivo: null, erro: "Sessão expirada. Entre de novo." };
  }

  try {
    const resposta = await fetch("/api/convite", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ email, papel, escolaId, mensagem, dias }),
    });
    const corpo = await resposta.json();

    if (!resposta.ok) {
      return { link: null, enviado: false, motivo: null, erro: corpo?.erro ?? "Falha ao criar o convite." };
    }
    return {
      link: typeof corpo?.link === "string" ? corpo.link : null,
      enviado: Boolean(corpo?.enviado),
      motivo: corpo?.motivo ?? null,
      erro: null,
    };
  } catch (err) {
    return {
      link: null,
      enviado: false,
      motivo: null,
      erro: err instanceof Error ? err.message : "Falha de rede ao criar o convite.",
    };
  }
}

export async function revogarConvite(conviteId: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc("admin_revoga_convite", { p_convite_id: conviteId });
  return { erro: error?.message ?? null };
}

/**
 * Em que pé está o convite, com o vencimento já resolvido.
 *
 * A validade vive no banco e é ele quem a aplica no resgate; esta conta
 * serve só para a lista não mostrar como "aberto" um convite que venceu
 * ontem e não vai funcionar para ninguém.
 *
 * A ordem importa: revogado vence resgatado, que vence expirado. Um
 * convite aceito e depois vencido é um convite aceito — a data de
 * validade não desfaz o que já aconteceu.
 */
export function situacaoDoConvite(c: Convite, agora: number = Date.now()): SituacaoConvite {
  if (c.revogado_em) return "revogado";
  if (c.resgatado_em) return "resgatado";
  if (new Date(c.expira_em).getTime() < agora) return "expirado";
  return "aberto";
}

// ── Lado de quem foi convidado ────────────────────────────────────────

export async function carregarConvite(token: string): Promise<ConviteAberto | null> {
  const { data, error } = await supabase.rpc("convite_do_token", { p_token: token });
  const linha = Array.isArray(data) ? data[0] : data;
  if (error || !linha) return null;
  return {
    emailMascarado: String(linha.email_mascarado),
    papel: String(linha.papel) as Papel,
    escolaNome: linha.escola_nome ?? null,
    mensagem: linha.mensagem ?? null,
    expiraEm: String(linha.expira_em),
    situacao: String(linha.situacao) as SituacaoConvite,
  };
}

/**
 * Aceita o convite com a sessão que estiver aberta.
 *
 * Devolve para onde mandar a pessoa: quem já ganhou vínculo com uma
 * escola tem onde trabalhar agora, e quem foi convidado como professor
 * sem escola precisa cadastrar a dele antes de qualquer outra coisa.
 */
export async function resgatarConvite(
  token: string
): Promise<{ destino: string | null; erro: string | null }> {
  const { data, error } = await supabase.rpc("resgatar_convite", { p_token: token });
  if (error) return { destino: null, erro: error.message };
  return { destino: data === "onboarding" ? "/onboarding" : "/painel", erro: null };
}

// ── O token entre uma tela e outra ────────────────────────────────────

/*
  O convite precisa sobreviver a uma ida e volta.

  Quem cria conta pelo link vai confirmar o e-mail, e volta pelo link do
  Supabase — não pelo da página do convite. Sem guardar o token, a
  pessoa chega logada, sem papel e sem escola, e o convite fica aberto
  para sempre sem que ninguém entenda por quê.
*/
export function guardarConvite(token: string): void {
  try {
    localStorage.setItem(CHAVE_CONVITE, token);
  } catch {
    // Navegador com armazenamento bloqueado. O resgate ainda funciona
    // se a pessoa entrar sem sair da página; só não sobrevive à volta.
  }
}

export function conviteGuardado(): string | null {
  try {
    return localStorage.getItem(CHAVE_CONVITE);
  } catch {
    return null;
  }
}

export function esquecerConvite(): void {
  try {
    localStorage.removeItem(CHAVE_CONVITE);
  } catch {
    // Idem: não há o que fazer, e não é erro que a pessoa precise ver.
  }
}

/**
 * O convite falhou de um jeito que não adianta tentar de novo?
 *
 * Revogado, expirado, já usado e inexistente são definitivos: insistir
 * a cada carregamento de página só produziria erro repetido. Já "outro
 * e-mail" é recuperável — basta sair e entrar com o endereço certo —,
 * então o token fica guardado esperando a sessão correta.
 */
export function falhaDefinitiva(erro: string): boolean {
  const m = erro.toLowerCase();
  return (
    m.includes("cancelado") ||
    m.includes("expirou") ||
    m.includes("já foi usado") ||
    m.includes("não encontrado")
  );
}
