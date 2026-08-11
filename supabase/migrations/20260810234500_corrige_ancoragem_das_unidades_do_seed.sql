-- =====================================================================
-- Oceano na Escola — 20260810234500_corrige_ancoragem_das_unidades_do_seed.sql
--
-- Metade das celulas do seed nao aparecia na grade publica.
--
-- O seed posicionava as tres unidades de cada celula deslocando-as em
-- torno de um centro arbitrario. Quando esse centro cai perto da divisa
-- da celula, deslocamentos de ate 20 m atravessam a fronteira e as tres
-- unidades caem em vertices diferentes da grade de 100 m. Cada grupo
-- fica com uma ou duas unidades, abaixo do piso de tres, e a celula
-- inteira e suprimida. Seis das doze celulas sumiram assim, uma delas
-- repartida em tres vertices.
--
-- A correcao ancora no vertice antes de deslocar: st_snaptogrid roda
-- primeiro, e o deslocamento de ate 20 m parte dali. Como a meia-celula
-- tem 50 m, as tres unidades ficam garantidamente na mesma celula.
--
-- Vale como regra para qualquer seed futuro: posicao de unidade
-- amostral de demonstracao se ancora no vertice, nunca no centro solto.
-- =====================================================================

update unidade_amostral u
set geom = st_transform(
             st_translate(
               st_snaptogrid(
                 st_transform(st_setsrid(st_makepoint(c.lng, c.lat), 4326), 31983),
                 100),
               d.dx, d.dy),
             4326)::geography
from (values
  ('a1', -46.8010, -24.1890),
  ('a2', -46.7990, -24.1895),
  ('a3', -46.8030, -24.1888),
  ('a4', -46.8050, -24.1892),
  ('b1', -46.7640, -24.1750),
  ('b2', -46.7620, -24.1755),
  ('b3', -46.7660, -24.1748),
  ('c1', -46.7880, -24.1835),
  ('c2', -46.7860, -24.1840),
  ('c3', -46.7900, -24.1838),
  ('d1', -46.8215, -24.2010),
  ('d2', -46.8235, -24.2015)
) as c(celula, lng, lat),
(values (1, -20.0, -15.0), (2, 0.0, 0.0), (3, 18.0, 12.0)) as d(ordem, dx, dy)
where u.metadados->>'seed' = 'piloto_ficticio'
  and u.metadados->>'celula' = c.celula
  and u.ordem = d.ordem;
