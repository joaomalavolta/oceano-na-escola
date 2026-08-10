-- =====================================================================
-- Oceano na Escola — 20260810203231_hardening_advisors.sql
-- Correções apontadas pelos Security Advisors do Supabase
-- =====================================================================

-- search_path fixo na função de trigger
create or replace function set_atualizado_em()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

-- As funções auxiliares de RLS eram chamáveis por qualquer um via
-- /rest/v1/rpc/. Elas existem para serem usadas dentro das políticas,
-- não pela API.
revoke execute on function app_papel() from anon, authenticated, public;
revoke execute on function app_is_admin() from anon, authenticated, public;
revoke execute on function app_is_pesquisador() from anon, authenticated, public;
revoke execute on function app_tem_vinculo(bigint) from anon, authenticated, public;

-- Tabela de sistema do PostGIS fora do alcance da API.
-- Não é possível ativar RLS nela: o owner é a extensão.
revoke all on table spatial_ref_sys from anon, authenticated;
