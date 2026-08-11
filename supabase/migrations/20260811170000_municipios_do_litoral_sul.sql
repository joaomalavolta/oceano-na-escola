-- =====================================================================
-- Oceano na Escola — 20260811170000_municipios_do_litoral_sul.sql
--
-- Sem isto, o cadastro de escola so funciona em Itanhaem.
--
-- A policy ref_escrita exige app_is_admin() para inserir municipio, e e
-- correto que exija: municipio e tabela de referencia, e deixar cada
-- professor digitar o nome da propria cidade produziria 'Itanhaem',
-- 'itanhaem' e 'Itanhaém' como tres municipios distintos, quebrando o
-- indicador por municipio que as premissas prometem.
--
-- A consequencia e que a lista tem de existir antes. Entram os
-- municipios costeiros de Sao Paulo onde o Ecosurf atua ou pode vir a
-- atuar. As coordenadas sao centroides aproximados, suficientes para
-- centralizar mapa — nao sao limite territorial.
--
-- Lista inicial, para o Ecosurf estender conforme a rede crescer.
-- =====================================================================

insert into municipio (nome, uf, geom)
select v.nome, 'SP', st_setsrid(st_makepoint(v.lng, v.lat), 4326)::geography
from (values
  ('Peruíbe',        -46.9979, -24.3200),
  ('Mongaguá',       -46.6206, -24.0925),
  ('Praia Grande',   -46.4029, -24.0058),
  ('São Vicente',    -46.3922, -23.9631),
  ('Santos',         -46.3336, -23.9608),
  ('Guarujá',        -46.2564, -23.9931),
  ('Bertioga',       -46.1389, -23.8539),
  ('Cubatão',        -46.4256, -23.8953),
  ('Iguape',         -47.5553, -24.7081),
  ('Ilha Comprida',  -47.5556, -24.7297),
  ('Cananéia',       -47.9269, -25.0147)
) as v(nome, lng, lat)
where not exists (
  select 1 from municipio m where m.nome = v.nome and m.uf = 'SP'
);
