-- =====================================================================
-- Oceano na Escola — 20260810203118_rls_e_views_publicas.sql
-- RLS escopado por escola + camada pública do cenário C
-- =====================================================================

-- ---------------------------------------------------------------------
-- Funções auxiliares
-- ---------------------------------------------------------------------

create or replace function app_papel()
returns papel_usuario language sql stable security definer set search_path = public as $$
  select papel from perfil where id = auth.uid();
$$;

create or replace function app_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(app_papel() = 'admin_ecosurf', false);
$$;

create or replace function app_tem_vinculo(p_escola_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select app_is_admin()
      or exists (select 1 from vinculo_escola
                 where perfil_id = auth.uid() and escola_id = p_escola_id);
$$;

create or replace function app_is_pesquisador()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(app_papel() in ('pesquisador','admin_ecosurf'), false);
$$;

-- ---------------------------------------------------------------------
-- Ativação
-- ---------------------------------------------------------------------

alter table municipio            enable row level security;
alter table escola               enable row level security;
alter table territorio           enable row level security;
alter table turma                enable row level security;
alter table perfil               enable row level security;
alter table vinculo_escola       enable row level security;
alter table protocolo            enable row level security;
alter table protocolo_versao     enable row level security;
alter table protocolo_secao      enable row level security;
alter table protocolo_campo      enable row level security;
alter table protocolo_item       enable row level security;
alter table expedicao            enable row level security;
alter table equipe               enable row level security;
alter table unidade_amostral     enable row level security;
alter table observacao_contagem  enable row level security;
alter table observacao_pontual   enable row level security;
alter table observacao_texto     enable row level security;
alter table evidencia            enable row level security;
alter table solicitacao_remocao  enable row level security;

-- ---------------------------------------------------------------------
-- Referência: leitura livre para logados, escrita só para o Ecosurf
-- ---------------------------------------------------------------------

create policy ref_leitura on municipio        for select to authenticated using (true);
create policy ref_leitura on territorio       for select to authenticated using (true);
create policy ref_leitura on protocolo        for select to authenticated using (true);
create policy ref_leitura on protocolo_versao for select to authenticated using (true);
create policy ref_leitura on protocolo_secao  for select to authenticated using (true);
create policy ref_leitura on protocolo_campo  for select to authenticated using (true);
create policy ref_leitura on protocolo_item   for select to authenticated using (true);

create policy ref_escrita on protocolo        for all to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy ref_escrita on protocolo_versao for all to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy ref_escrita on protocolo_secao  for all to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy ref_escrita on protocolo_campo  for all to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy ref_escrita on protocolo_item   for all to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy ref_escrita on municipio        for all to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy ref_escrita on territorio       for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

-- ---------------------------------------------------------------------
-- Perfil e vínculo
-- ---------------------------------------------------------------------

create policy perfil_proprio on perfil for select to authenticated
  using (id = auth.uid() or app_is_admin());
create policy perfil_edita on perfil for update to authenticated
  using (id = auth.uid() or app_is_admin())
  with check (id = auth.uid() or app_is_admin());
create policy perfil_insere on perfil for insert to authenticated
  with check (id = auth.uid());

create policy vinculo_leitura on vinculo_escola for select to authenticated
  using (perfil_id = auth.uid() or app_is_admin());
create policy vinculo_admin on vinculo_escola for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

-- ---------------------------------------------------------------------
-- Escola e turma
-- ---------------------------------------------------------------------

create policy escola_leitura on escola for select to authenticated
  using (app_tem_vinculo(id) or app_is_pesquisador());
create policy escola_escrita on escola for update to authenticated
  using (app_tem_vinculo(id)) with check (app_tem_vinculo(id));
create policy escola_insere on escola for insert to authenticated
  with check (auth.uid() is not null);

create policy turma_tudo on turma for all to authenticated
  using (app_tem_vinculo(escola_id)) with check (app_tem_vinculo(escola_id));

-- ---------------------------------------------------------------------
-- Expedição e observações
-- ---------------------------------------------------------------------

create policy expedicao_tudo on expedicao for all to authenticated
  using (app_tem_vinculo(escola_id) or app_is_pesquisador())
  with check (app_tem_vinculo(escola_id));

create policy equipe_tudo on equipe for all to authenticated
  using (exists (select 1 from expedicao e where e.id = expedicao_id
                 and (app_tem_vinculo(e.escola_id) or app_is_pesquisador())))
  with check (exists (select 1 from expedicao e where e.id = expedicao_id
                      and app_tem_vinculo(e.escola_id)));

create policy unidade_tudo on unidade_amostral for all to authenticated
  using (exists (select 1 from expedicao e where e.id = expedicao_id
                 and (app_tem_vinculo(e.escola_id) or app_is_pesquisador())))
  with check (exists (select 1 from expedicao e where e.id = expedicao_id
                      and app_tem_vinculo(e.escola_id)));

create policy contagem_tudo on observacao_contagem for all to authenticated
  using (exists (select 1 from unidade_amostral u join expedicao e on e.id = u.expedicao_id
                 where u.id = unidade_id
                 and (app_tem_vinculo(e.escola_id) or app_is_pesquisador())))
  with check (exists (select 1 from unidade_amostral u join expedicao e on e.id = u.expedicao_id
                      where u.id = unidade_id and app_tem_vinculo(e.escola_id)));

create policy pontual_tudo on observacao_pontual for all to authenticated
  using (exists (select 1 from expedicao e where e.id = expedicao_id
                 and (app_tem_vinculo(e.escola_id) or app_is_pesquisador())))
  with check (exists (select 1 from expedicao e where e.id = expedicao_id
                      and app_tem_vinculo(e.escola_id)));

create policy texto_tudo on observacao_texto for all to authenticated
  using (exists (select 1 from expedicao e where e.id = expedicao_id
                 and (app_tem_vinculo(e.escola_id) or app_is_pesquisador())))
  with check (exists (select 1 from expedicao e where e.id = expedicao_id
                      and app_tem_vinculo(e.escola_id)));

-- ---------------------------------------------------------------------
-- Evidências e pedidos de remoção
-- ---------------------------------------------------------------------

create policy evidencia_tudo on evidencia for all to authenticated
  using (app_tem_vinculo(escola_id) or app_is_pesquisador())
  with check (app_tem_vinculo(escola_id));

create policy remocao_leitura on solicitacao_remocao for select to authenticated
  using (app_is_admin()
         or exists (select 1 from evidencia ev where ev.id = evidencia_id
                    and app_tem_vinculo(ev.escola_id)));
create policy remocao_admin on solicitacao_remocao for update to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy remocao_publica on solicitacao_remocao for insert to anon, authenticated
  with check (true);

comment on policy remocao_publica on solicitacao_remocao is
  'Qualquer pessoa pode formalizar pedido de remocao sem ter conta. O prazo de 72 h corre a partir daqui.';

-- =====================================================================
-- Camada pública — cenário C
--
-- As views abaixo são security definer de propósito. É o que impede o
-- anon de alcançar qualquer tabela base: ele não tem grant em nenhuma.
-- Com security_invoker seria preciso dar select nas tabelas e expor
-- colunas indesejadas (observacoes, criado_por) via PostgREST.
-- O linter marca isso como ERROR sem distinguir os dois casos.
-- =====================================================================

create view pub_escola with (security_invoker = off) as
select e.id, e.slug, e.nome, e.apresentacao, m.nome as municipio, m.uf,
       st_y(e.geom::geometry) as lat, st_x(e.geom::geometry) as lng
from escola e join municipio m on m.id = e.municipio_id
where e.publicada = true;

create view pub_expedicao with (security_invoker = off) as
select x.id, x.numero, x.titulo, x.data_campo, x.extensao_m,
       x.n_mapeadores, x.n_equipes,
       e.slug as escola_slug, e.nome as escola_nome,
       t.nome as territorio,
       st_asgeojson(x.percurso::geometry) as percurso_geojson
from expedicao x
join escola e on e.id = x.escola_id and e.publicada = true
left join territorio t on t.id = x.territorio_id
where x.status = 'publicado';

create view pub_observacao_grade with (security_invoker = off) as
select
  st_asgeojson(st_transform(st_snaptogrid(st_transform(u.geom::geometry, 31983), 100), 4326)) as celula_geojson,
  e.slug as escola_slug,
  p.codigo as protocolo,
  date_trunc('month', x.data_campo)::date as mes,
  sum(oc.quantidade) as total_itens,
  sum(u.area_m2) as area_amostrada_m2,
  case when sum(u.area_m2) > 0
       then round(sum(oc.quantidade) / sum(u.area_m2), 3) else null end as densidade_itens_m2
from observacao_contagem oc
join unidade_amostral u  on u.id = oc.unidade_id
join expedicao x         on x.id = u.expedicao_id and x.status = 'publicado'
join escola e            on e.id = x.escola_id and e.publicada = true
join protocolo_versao pv on pv.id = u.versao_id
join protocolo p         on p.id = pv.protocolo_id
group by 1,2,3,4;

comment on view pub_observacao_grade is
  'Visitante sem login nunca ve coordenada exata. Localizacao agregada em grade de 100 m (SIRGAS 2000 / UTM 23S).';

create view pub_indicador_escola with (security_invoker = off) as
select e.slug as escola_slug,
       count(distinct x.id) as expedicoes,
       coalesce(sum(distinct x.extensao_m), 0) as extensao_total_m,
       coalesce(sum(oc.quantidade), 0) as itens_catalogados,
       count(distinct op.id) as registros_pontuais
from escola e
left join expedicao x on x.escola_id = e.id and x.status = 'publicado'
left join unidade_amostral u on u.expedicao_id = x.id
left join observacao_contagem oc on oc.unidade_id = u.id
left join observacao_pontual op on op.expedicao_id = x.id
where e.publicada = true
group by e.slug;

create view pub_galeria with (security_invoker = off) as
select ev.id, ev.storage_path, ev.legenda, ev.publicada_em,
       e.slug as escola_slug, x.numero as expedicao_numero
from evidencia ev
join escola e on e.id = ev.escola_id and e.publicada = true and e.termos_ok = true
left join expedicao x on x.id = ev.expedicao_id
where ev.status = 'publicada'
  and ev.tipo in ('foto_campo','foto_quadrat');

comment on view pub_galeria is
  'Servir com cabecalho noindex. Foto de turma nao deve aparecer em busca de imagens.';

-- ---------------------------------------------------------------------
-- Permissões da camada pública
-- ---------------------------------------------------------------------

revoke all on all tables in schema public from anon;

grant select on pub_escola, pub_expedicao, pub_observacao_grade,
                pub_indicador_escola, pub_galeria to anon, authenticated;
grant insert on solicitacao_remocao to anon;
grant usage, select on sequence solicitacao_remocao_id_seq to anon;
