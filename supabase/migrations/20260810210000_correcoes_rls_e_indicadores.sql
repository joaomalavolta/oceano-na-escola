-- =====================================================================
-- Oceano na Escola — 20260810210000_correcoes_rls_e_indicadores.sql
--
-- Corrige seis defeitos verificados em banco:
--   1. o revoke do hardening tornava toda a base inacessivel ao logado
--   2. qualquer usuario podia se promover a admin_ecosurf
--   3. qualquer usuario podia publicar escola no mapa publico
--   4. anon controlava as colunas de controle do pedido de remocao
--   5. indicadores publicos inflados por produto cartesiano
--   6. densidade publica pela metade, por area contada varias vezes
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Restabelece o execute das funcoes de RLS
--
-- A expressao de uma policy e avaliada com os privilegios de quem faz a
-- consulta. Sem execute, toda policy que chama estas funcoes falha com
-- "permission denied for function" e a tabela fica ilegivel.
-- As funcoes so respondem sobre o proprio chamador (qual o meu papel,
-- tenho vinculo com esta escola), entao expo-las no rpc nao vaza dado
-- de terceiro.
-- ---------------------------------------------------------------------

grant execute on function app_papel()                to authenticated;
grant execute on function app_is_admin()             to authenticated;
grant execute on function app_is_pesquisador()       to authenticated;
grant execute on function app_tem_vinculo(bigint)    to authenticated;

-- ---------------------------------------------------------------------
-- 2. O papel deixa de ser escrito pelo proprio usuario
--
-- RLS nao filtra coluna: a policy aprovava a linha inteira. O controle
-- por coluna e privilegio de grant, nao de policy.
-- ---------------------------------------------------------------------

revoke insert, update on perfil from authenticated;
grant  insert (id, nome) on perfil to authenticated;
grant  update (nome)     on perfil to authenticated;

-- ---------------------------------------------------------------------
-- 3. Escola nasce despublicada, e quem cria fica vinculado
-- ---------------------------------------------------------------------

revoke insert on escola from authenticated;
grant  insert (municipio_id, nome, slug, rede_ensino, endereco, geom, apresentacao)
  on escola to authenticated;

create or replace function vincula_criador_escola()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into vinculo_escola (perfil_id, escola_id)
  values (auth.uid(), new.id)
  on conflict do nothing;
  return new;
end $$;

create trigger trg_escola_vincula_criador
  after insert on escola
  for each row when (auth.uid() is not null)
  execute function vincula_criador_escola();

-- ---------------------------------------------------------------------
-- 4. Pedido de remocao: anon escreve so o que e dele
--
-- Antes, quem nao tem conta gravava atendida_em e prazo_em, podendo
-- registrar um pedido ja nascido atendido e com prazo de dez anos.
-- ---------------------------------------------------------------------

revoke insert on solicitacao_remocao from anon;
grant  insert (evidencia_id, solicitante_nome, solicitante_contato, motivo)
  on solicitacao_remocao to anon;

-- ---------------------------------------------------------------------
-- 5. e 6. Indicadores publicos
--
-- pub_indicador_escola encadeava tres left joins irmaos a partir de
-- expedicao. Cada registro pontual multiplicava as linhas de contagem,
-- e sum(distinct extensao_m) somava valores distintos, nao expedicoes:
-- duas saidas de 50 m viravam 50 m.
--
-- pub_observacao_grade repetia a area da unidade uma vez por linha de
-- contagem, inflando o denominador e derrubando a densidade.
--
-- A correcao agrega cada ramo no seu proprio nivel antes de juntar.
-- ---------------------------------------------------------------------

drop view if exists pub_indicador_escola;
create view pub_indicador_escola with (security_invoker = off) as
select
  e.slug as escola_slug,
  coalesce(x.expedicoes, 0)        as expedicoes,
  coalesce(x.extensao_total_m, 0)  as extensao_total_m,
  coalesce(x.itens_catalogados, 0) as itens_catalogados,
  coalesce(x.registros_pontuais,0) as registros_pontuais
from escola e
left join lateral (
  select
    count(*)                                  as expedicoes,
    sum(x.extensao_m)                         as extensao_total_m,
    sum((select coalesce(sum(oc.quantidade), 0)
         from unidade_amostral u
         join observacao_contagem oc on oc.unidade_id = u.id
         where u.expedicao_id = x.id))        as itens_catalogados,
    sum((select count(*) from observacao_pontual op
         where op.expedicao_id = x.id))       as registros_pontuais
  from expedicao x
  where x.escola_id = e.id and x.status = 'publicado'
) x on true
where e.publicada = true;

drop view if exists pub_observacao_grade;
create view pub_observacao_grade with (security_invoker = off) as
with unidade_ag as (
  -- uma linha por unidade amostral: a area entra uma vez so
  select u.id, u.geom, u.area_m2, u.expedicao_id, u.versao_id,
         coalesce(sum(oc.quantidade), 0) as itens
  from unidade_amostral u
  join observacao_contagem oc on oc.unidade_id = u.id
  group by u.id, u.geom, u.area_m2, u.expedicao_id, u.versao_id
)
select
  st_asgeojson(st_transform(st_snaptogrid(st_transform(ua.geom::geometry, 31983), 100), 4326)) as celula_geojson,
  e.slug   as escola_slug,
  p.codigo as protocolo,
  date_trunc('month', x.data_campo)::date as mes,
  sum(ua.itens)    as total_itens,
  sum(ua.area_m2)  as area_amostrada_m2,
  case when sum(ua.area_m2) > 0
       then round(sum(ua.itens) / sum(ua.area_m2), 3) else null end as densidade_itens_m2
from unidade_ag ua
join expedicao x         on x.id = ua.expedicao_id and x.status = 'publicado'
join escola e            on e.id = x.escola_id and e.publicada = true
join protocolo_versao pv on pv.id = ua.versao_id
join protocolo p         on p.id = pv.protocolo_id
group by 1,2,3,4;

comment on view pub_observacao_grade is
  'Visitante sem login nunca ve coordenada exata. Localizacao agregada em grade de 100 m (SIRGAS 2000 / UTM 23S).';

grant select on pub_indicador_escola, pub_observacao_grade to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. Tabela criada depois nao nasce exposta ao anon
--
-- O revoke da migration anterior alcancou so as tabelas que existiam
-- naquele instante. O Supabase mantem default privileges que concedem
-- acesso a cada tabela nova.
-- ---------------------------------------------------------------------

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
