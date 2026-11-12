/**
 * O que a conta logada pode fazer na rede, perguntado ao banco.
 *
 * Quem decide é a função `app_pode_cadastrar_escola()` — a mesma que a
 * política de inserção de `escola` usa. A tela só pergunta antes, para
 * dizer o porquê em vez de deixar o cadastro falhar no último passo.
 */

import { supabase } from "./supabase";

/** `null` quando a pergunta não pôde ser feita (rede, banco fora). */
export async function podeCadastrarEscola(): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("app_pode_cadastrar_escola");
  if (error) return null;
  return data === true;
}
