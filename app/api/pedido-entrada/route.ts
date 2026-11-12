import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { enviarEmail, REMETENTE_EMAIL } from "@/lib/email";
import {
  avisoDoPedido,
  normalizarPedido,
  PEDIDO_VAZIO,
  problemasDoPedido,
  tipoParaOBanco,
  type DadosDoPedido,
} from "@/lib/pedido-entrada";

/**
 * Recebe o pedido de entrada do formulário público.
 *
 * Grava pela função `pedir_entrada`, com a chave anônima — a mesma que o
 * navegador já tem. A rota existe só por causa do e-mail de aviso ao
 * Ecosurf, cuja credencial não pode ir ao navegador.
 *
 * A resposta é a mesma para pedido novo e pedido repetido: o formulário
 * não pode servir para descobrir quem já pediu.
 */

export const runtime = "nodejs";

const OK = { ok: true };

export async function POST(req: Request) {
  let bruto: Partial<DadosDoPedido>;
  try {
    bruto = (await req.json()) as Partial<DadosDoPedido>;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  // Monta só com os campos conhecidos e do tipo certo: o resto do corpo
  // é ignorado, não repassado.
  const texto = (v: unknown) => (typeof v === "string" ? v : "");
  const dados: DadosDoPedido = {
    ...PEDIDO_VAZIO,
    nome: texto(bruto.nome),
    email: texto(bruto.email),
    tipo: bruto.tipo === "surf" || bruto.tipo === "outra" ? bruto.tipo : "regular",
    papel: (texto(bruto.papel) || "professor") as DadosDoPedido["papel"],
    organizacao: texto(bruto.organizacao),
    municipio: texto(bruto.municipio),
    funcao: texto(bruto.funcao),
    mensagem: texto(bruto.mensagem),
    consentimento: bruto.consentimento === true,
    site: texto(bruto.site),
  };

  // Armadilha preenchida: é robô. Responde como se tivesse dado certo,
  // para ele não aprender a desviar, e não grava nada.
  if (dados.site.trim() !== "") return NextResponse.json(OK);

  const problemas = problemasDoPedido(dados);
  if (Object.keys(problemas).length > 0) {
    return NextResponse.json({ erro: "Há campos a corrigir.", problemas }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ erro: "Servidor sem as variáveis do Supabase." }, { status: 500 });
  }

  const n = normalizarPedido(dados);
  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.rpc("pedir_entrada", {
    p_nome: n.nome,
    p_email: n.email,
    p_tipo: tipoParaOBanco(n.tipo),
    p_papel: n.papel,
    p_organizacao: n.organizacao,
    p_municipio: n.municipio || null,
    p_funcao: n.funcao || null,
    p_mensagem: n.mensagem || null,
  });

  if (error) {
    if (error.code === "54000") {
      return NextResponse.json({ erro: error.message }, { status: 429 });
    }
    return NextResponse.json({ erro: "Não foi possível registrar o pedido agora. Tente de novo." }, { status: 400 });
  }

  // O aviso é a segunda coisa, nunca a primeira: se o e-mail não sair, o
  // pedido já está na Administração e ninguém perde nada. Vai a cada
  // envio aceito — inclusive o repetido, que o banco não duplica — e é
  // o preço de a resposta não dizer se o e-mail já tinha pedido.
  const origem = req.headers.get("origin") ?? new URL(req.url).origin;
  const aviso = avisoDoPedido(n, `${origem}/admin#pedidos`);
  await enviarEmail({ para: REMETENTE_EMAIL, ...aviso });

  return NextResponse.json(OK);
}
