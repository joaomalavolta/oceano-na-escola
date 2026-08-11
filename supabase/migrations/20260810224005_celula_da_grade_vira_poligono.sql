-- =====================================================================
-- Oceano na Escola — 20260810230000_celula_da_grade_vira_poligono.sql
--
-- celula_geojson entregava um Point, nao uma celula.
--
-- st_snaptogrid devolve o vertice da grade para onde a unidade amostral
-- foi puxada — um ponto. A coluna se chamava celula, o comentario falava
-- em grade de 100 m, e o mapa desenha essa camada como preenchimento:
-- um ponto nao preenche nada, e a camada de densidade sairia invisivel.
--
-- st_expand(ponto, 50) no CRS projetado devolve o quadrado de 100 m por
-- 100 m centrado naquele vertice, que e a celula de fato. Verificado no
-- PostGIS do projeto: ST_Polygon, 100 m de largura por 100 m de altura.
--
-- Nada muda na agregacao nem no piso de tres unidades amostrais. Muda
-- so a geometria publicada.
-- =====================================================================

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
  st_asgeojson(
    st_transform(
      st_expand(
        st_snaptogrid(st_transform(ua.geom::geometry, 31983), 100),
        50),
      4326)
  ) as celula_geojson,
  e.slug   as escola_slug,
  p.codigo as protocolo,
  date_trunc('month', x.data_campo)::date as mes,
  count(distinct ua.id) as unidades_amostrais,
  sum(ua.itens)         as total_itens,
  sum(ua.area_m2)       as area_amostrada_m2,
  case when sum(ua.area_m2) > 0
       then round(sum(ua.itens) / sum(ua.area_m2), 3) else null end as densidade_itens_m2
from unidade_ag ua
join expedicao x         on x.id = ua.expedicao_id and x.status = 'publicado'
join escola e            on e.id = x.escola_id and e.publicada = true
join protocolo_versao pv on pv.id = ua.versao_id
join protocolo p         on p.id = pv.protocolo_id
group by 1,2,3,4
having count(distinct ua.id) >= 3;

comment on view pub_observacao_grade is
  'Visitante sem login nunca ve coordenada exata. Localizacao agregada em celula de 100 m '
  '(SIRGAS 2000 / UTM 23S), publicada como poligono, e a celula so aparece a partir de tres '
  'unidades amostrais.';

grant select on pub_observacao_grade to anon, authenticated;
