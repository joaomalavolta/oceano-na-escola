import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Cliente do Supabase para o front-end.
 * Se as variáveis de ambiente não estiverem configuradas, o sistema
 * responde graciosamente utilizando o repositório de dados mock.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
