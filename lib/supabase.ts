import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Diz se o projeto tem para onde apontar. Quando falta configuração, a
 * camada de dados usa o repositório de mock em vez de tentar uma
 * conexão que falharia — ver lib/dados-publicos.ts.
 */
export const supabaseConfigurado = supabaseUrl !== "" && supabaseAnonKey !== "";

/**
 * Cliente do Supabase para o front-end.
 *
 * Usa apenas a chave anônima, que é pública por natureza: o que ela
 * alcança é decidido pelo RLS e pelos grants do banco, não pelo sigilo
 * da chave. Chave de service_role nunca entra em código de browser.
 *
 * Sem configuração, aponta para um endereço inerte, e o cliente só
 * existe para manter os tipos. Nenhuma consulta chega a ser feita.
 */
export const supabase = createClient(
  supabaseConfigurado ? supabaseUrl : "https://placeholder.supabase.co",
  supabaseConfigurado ? supabaseAnonKey : "placeholder-anon-key"
);
