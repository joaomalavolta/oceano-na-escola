import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { enviarEmail, meioDeEnvio } from "@/lib/email";
import {
  assuntoDoConvite,
  htmlDoConvite,
  textoDoConvite,
  type DadosDoConvite,
} from "@/lib/email-convite";
import type { Papel } from "@/lib/administracao";

/**
 * Cria o convite e manda o e-mail.
 *
 * Precisa existir porque a credencial do remetente não pode chegar ao
 * navegador. Mas a rota não decide quem pode convidar: ela chama
 * `admin_cria_convite` **com o token de quem pediu**, e é o banco que
 * confere o papel, como já conferia quando o navegador chamava direto.
 * Assim não há um segundo lugar guardando regra de permissão — e a
 * chave de service_role continua não existindo em lugar nenhum.
 *
 * O e-mail é a segunda coisa a acontecer, nunca a primeira. Se ele
 * falhar, o convite já está criado e o link volta na resposta: o
 * Ecosurf manda à mão e ninguém perde o trabalho.
 */

export const runtime = "nodejs";

interface Corpo {
  email?: string;
  papel?: Papel;
  escolaId?: number | null;
  mensagem?: string;
  dias?: number;
}

export async function POST(req: Request) {
  const autorizacao = req.headers.get("authorization") ?? "";
  const jwt = autorizacao.replace(/^Bearer\s+/i, "").trim();
  if (jwt === "") {
    return NextResponse.json({ erro: "Sessão ausente." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { erro: "Servidor sem as variáveis do Supabase." },
      { status: 500 }
    );
  }

  let corpo: Corpo;
  try {
    corpo = (await req.json()) as Corpo;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const email = (corpo.email ?? "").trim().toLowerCase();
  if (email === "") {
    return NextResponse.json({ erro: "Informe o e-mail de quem convidar." }, { status: 400 });
  }

  // Cliente com a sessão de quem pediu. Sem persistência: cada requisição
  // é uma, e guardar sessão num processo compartilhado misturaria
  // usuários entre requisições.
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: token, error } = await supabase.rpc("admin_cria_convite", {
    p_email: email,
    p_papel: corpo.papel ?? "professor",
    p_escola_id: corpo.escolaId ?? null,
    p_mensagem: corpo.mensagem ?? null,
    p_dias: corpo.dias ?? 14,
  });

  if (error || typeof token !== "string") {
    // 403 quando o banco recusou por papel; 400 para o resto, que é
    // erro de preenchimento — e-mail repetido, validade fora da faixa.
    const status = error?.code === "42501" ? 403 : 400;
    return NextResponse.json(
      { erro: error?.message ?? "Não foi possível criar o convite." },
      { status }
    );
  }

  // Origem vinda do próprio pedido: o link tem de apontar para onde a
  // pessoa está — produção, pré-visualização da Vercel ou localhost.
  const origem = req.headers.get("origin") ?? new URL(req.url).origin;
  const link = `${origem}/convite/${token}`;

  // Quem convidou e a escola, para o e-mail se apresentar. Falha aqui
  // não impede o envio: são enfeites do texto, não o texto.
  const [{ data: perfil }, { data: escola }] = await Promise.all([
    supabase.from("perfil").select("nome").maybeSingle(),
    corpo.escolaId
      ? supabase.from("escola").select("nome").eq("id", corpo.escolaId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const { data: criado } = await supabase
    .from("convite")
    .select("expira_em")
    .eq("token", token)
    .maybeSingle();

  const dados: DadosDoConvite = {
    para: email,
    papel: corpo.papel ?? "professor",
    escolaNome: escola?.nome ? String(escola.nome) : null,
    mensagem: (corpo.mensagem ?? "").trim() || null,
    link,
    expiraEm: criado?.expira_em ? String(criado.expira_em) : new Date().toISOString(),
    convidadoPor: perfil?.nome ? String(perfil.nome) : null,
  };

  const { enviado, motivo } = await enviarEmail({
    para: email,
    assunto: assuntoDoConvite(dados.escolaNome),
    html: htmlDoConvite(dados),
    texto: textoDoConvite(dados),
  });

  return NextResponse.json({ token, link, enviado, motivo, meio: meioDeEnvio() });
}
