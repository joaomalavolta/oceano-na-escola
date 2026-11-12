/**
 * Os pedidos de entrada, do lado do Ecosurf.
 *
 * Só a administração lê a tabela (RLS). Aceitar um pedido é convidar: o
 * convite sai pela rota de convite, que manda o e-mail, e depois o
 * pedido é marcado como respondido — o banco liga um ao outro pelo
 * e-mail. Recusar só registra a decisão; quem responde à pessoa é o
 * Ecosurf, pelo e-mail dela.
 */

import { supabase } from "./supabase";
import { criarConvite } from "./convites";
import type { Papel } from "./administracao";

export type SituacaoPedido = "pendente" | "convidado" | "recusado";

export interface PedidoDeEntrada {
  id: number;
  nome: string;
  email: string;
  tipo: "regular" | "surf" | null;
  papel_pretendido: Exclude<Papel, "admin_ecosurf">;
  organizacao: string;
  municipio: string | null;
  funcao: string | null;
  mensagem: string | null;
  situacao: SituacaoPedido;
  criado_em: string;
  analisado_em: string | null;
  motivo_recusa: string | null;
}

/** Pendentes primeiro, e dentro de cada grupo os mais novos em cima. */
export function ordenarPedidos(lista: PedidoDeEntrada[]): PedidoDeEntrada[] {
  const peso: Record<SituacaoPedido, number> = { pendente: 0, convidado: 1, recusado: 1 };
  return [...lista].sort(
    (a, b) => peso[a.situacao] - peso[b.situacao] || b.criado_em.localeCompare(a.criado_em)
  );
}

export async function listarPedidos(): Promise<{ pedidos: PedidoDeEntrada[]; erro: string | null }> {
  const { data, error } = await supabase
    .from("pedido_entrada")
    .select(
      "id, nome, email, tipo, papel_pretendido, organizacao, municipio, funcao, mensagem, situacao, criado_em, analisado_em, motivo_recusa"
    )
    .order("criado_em", { ascending: false })
    .limit(200);
  if (error) return { pedidos: [], erro: error.message };
  return {
    pedidos: ordenarPedidos(
      (data ?? []).map((p) => ({ ...p, id: Number(p.id) }) as PedidoDeEntrada)
    ),
    erro: null,
  };
}

/**
 * Convida quem pediu. O convite primeiro: se ele falhar, o pedido
 * continua pendente, e nada fica marcado como respondido sem resposta.
 */
export async function convidarPedido(
  p: PedidoDeEntrada,
  mensagem: string
): Promise<{ erro: string | null; link: string | null; enviado: boolean; motivo: string | null }> {
  const convite = await criarConvite(p.email, p.papel_pretendido, null, mensagem, 14);
  if (convite.erro || !convite.link) {
    // Pode já haver convite em aberto para este e-mail — mandado à mão,
    // antes do pedido. Nesse caso o pedido se liga a ele e está
    // respondido; se não houver, o erro do convite é o que vale.
    const { error } = await supabase.rpc("admin_marca_pedido_convidado", { p_id: p.id });
    if (!error) {
      return {
        erro: null,
        link: null,
        enviado: false,
        motivo: "Já havia um convite em aberto para este e-mail. O pedido foi ligado a ele; nenhum e-mail novo saiu.",
      };
    }
    return { erro: convite.erro ?? "O convite não pôde ser criado.", link: null, enviado: false, motivo: null };
  }
  const { error } = await supabase.rpc("admin_marca_pedido_convidado", { p_id: p.id });
  return {
    erro: error ? `Convite criado, mas o pedido não foi marcado: ${error.message}` : null,
    link: convite.link,
    enviado: convite.enviado,
    motivo: convite.motivo,
  };
}

export async function recusarPedido(id: number, motivo: string): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc("admin_recusa_pedido", { p_id: id, p_motivo: motivo });
  return { erro: error?.message ?? null };
}
