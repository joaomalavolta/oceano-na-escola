"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase, supabaseConfigurado } from "./supabase";

/**
 * Sessão do Supabase Auth, disponível para a árvore inteira.
 *
 * Substitui o simulador que guardava a chave `oceano_auth` no
 * localStorage. Aquilo não era autenticação: qualquer visitante podia
 * escrever a chave pelo console e a interface o tratava como logado.
 * O que protege os dados e o RLS, mas a interface mentia sobre quem
 * estava dentro.
 */

export type PapelUsuario =
  | "professor"
  | "coordenacao_escolar"
  | "coordenacao_municipal"
  | "pesquisador"
  | "admin_ecosurf";

export interface Perfil {
  id: string;
  nome: string;
  papel: PapelUsuario;
}

interface Sessao {
  /** null enquanto carrega; depois, a sessão ou a ausência dela. */
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  carregando: boolean;
  /** false quando faltam as variáveis de ambiente do Supabase. */
  disponivel: boolean;
  sair: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

const ContextoSessao = createContext<Sessao | null>(null);

/**
 * Garante que exista uma linha em `perfil` para o usuário.
 *
 * O papel nunca vem daqui: a migration de correcoes_rls_e_indicadores
 * concede insert apenas nas colunas (id, nome), justamente para que
 * ninguem se cadastre como admin_ecosurf. Quem chega entra como
 * professor, que e o default da coluna, e o Ecosurf ajusta depois.
 */
async function garantirPerfil(user: User): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from("perfil")
    .select("id, nome, papel")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return null;
  if (data) return data as Perfil;

  const nome =
    (user.user_metadata?.nome as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Educador";

  const { error: erroInsert } = await supabase
    .from("perfil")
    .insert({ id: user.id, nome });

  if (erroInsert) return null;

  const { data: criado } = await supabase
    .from("perfil")
    .select("id, nome, papel")
    .eq("id", user.id)
    .maybeSingle();

  return (criado as Perfil) ?? null;
}

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  // Sem configuração não há o que carregar: já nasce resolvido.
  const [carregando, setCarregando] = useState(supabaseConfigurado);

  const sincronizarPerfil = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setPerfil(null);
      return;
    }
    setPerfil(await garantirPerfil(s.user));
  }, []);

  useEffect(() => {
    if (!supabaseConfigurado) return;

    let ativo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      setSession(data.session);
      await sincronizarPerfil(data.session);
      if (ativo) setCarregando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evento, s) => {
      if (!ativo) return;
      setSession(s);
      await sincronizarPerfil(s);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [sincronizarPerfil]);

  const sair = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPerfil(null);
  }, []);

  const recarregarPerfil = useCallback(async () => {
    await sincronizarPerfil(session);
  }, [session, sincronizarPerfil]);

  const valor = useMemo<Sessao>(
    () => ({
      session,
      user: session?.user ?? null,
      perfil,
      carregando,
      disponivel: supabaseConfigurado,
      sair,
      recarregarPerfil,
    }),
    [session, perfil, carregando, sair, recarregarPerfil]
  );

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao(): Sessao {
  const ctx = useContext(ContextoSessao);
  if (!ctx) {
    throw new Error("useSessao precisa estar dentro de <ProvedorSessao>.");
  }
  return ctx;
}
