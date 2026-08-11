-- =====================================================================
-- Oceano na Escola — territórios fictícios do piloto
--
-- A tabela territorio nunca foi semeada, e a policy ref_escrita só
-- deixa o Ecosurf escrever nela: a tela de nova expedição abria com o
-- campo vazio e sem caminho para preencher.
--
-- Os nomes são inventados, como os das escolas. Nomear a praia real
-- que uma turma monitora identifica a turma — é a mesma razão pela qual
-- o mapa público agrega em células de 100 m.
-- =====================================================================

insert into territorio (municipio_id, nome, tipo, geom)
select m.id, v.nome, v.tipo, st_geogfromtext('SRID=4326;' || v.wkt)
from municipio m
cross join (values
  ('Praia do Sol Nascente',      'praia',
   'LINESTRING(-46.7700 -24.1760, -46.7580 -24.1700)'),
  ('Praia da Barra Longa',       'praia',
   'LINESTRING(-46.8080 -24.1920, -46.7950 -24.1840)'),
  ('Praia das Dunas Altas',      'praia',
   'LINESTRING(-46.8280 -24.2050, -46.8160 -24.1975)'),
  ('Foz do Rio Claro',           'foz',
   'POINT(-46.7890 -24.1845)'),
  ('Restinga do Sertão Novo',    'restinga',
   'POINT(-46.8150 -24.1980)'),
  ('Manguezal da Enseada Funda', 'manguezal',
   'POINT(-46.7820 -24.1900)'),
  ('Costão da Pedra Alta',       'costao',
   'POINT(-46.7550 -24.1690)')
) as v(nome, tipo, wkt)
where m.nome = 'Itanhaém' and m.uf = 'SP'
  and not exists (
    select 1 from territorio t
    where t.municipio_id = m.id and t.nome = v.nome
  );

comment on table territorio is
  'Trecho monitorado: praia, restinga, foz, manguezal ou costão. Nomes do piloto são fictícios.';
