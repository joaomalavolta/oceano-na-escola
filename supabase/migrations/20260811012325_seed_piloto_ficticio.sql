-- =====================================================================
-- Oceano na Escola — 20260810233000_seed_piloto_ficticio.sql
--
-- Piloto de demonstracao, inteiramente ficticio, conforme o bloco 6 das
-- premissas: escola, turma, expedicao e ficha preenchida sao inventadas,
-- e nenhuma escola, aluno ou dado real entra aqui.
--
-- Desenho da amostragem
--
-- A grade publica so exibe celula com tres ou mais unidades amostrais.
-- Por isso cada celula recebe exatamente tres unidades, deslocadas de
-- poucos metros entre si para cairem no mesmo vertice da grade de 100 m,
-- e as celulas ficam a cerca de 200 m umas das outras para nao se
-- fundirem no mesmo vertice.
--
-- Residuos (RES): trecho de 50 m por 2 m, 100 m2 por unidade, 300 m2
-- por celula. Microplasticos (MIC): quadrat de 0,25 m2, 0,75 m2 por
-- celula. As contagens do RES apontam para item de lista; as do MIC
-- para campo declarado em ficha, que e como o schema separa os dois.
--
-- A chave da celula viaja em unidade_amostral.metadados, para que a
-- contagem de cada unidade seja ligada a sua celula sem depender de
-- area ou coordenada, que se repetem entre celulas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Municipio, escolas e turmas
-- ---------------------------------------------------------------------

insert into municipio (nome, uf, geom)
values ('Itanhaém', 'SP', st_geogfromtext('SRID=4326;POINT(-46.7889 -24.1831)'))
on conflict (nome, uf) do nothing;

insert into escola (municipio_id, nome, slug, rede_ensino, endereco, geom, apresentacao, publicada, termos_ok)
select m.id, v.nome, v.slug, v.rede,
       'Endereço fictício - Itanhaém - SP',
       st_setsrid(st_makepoint(v.lng, v.lat), 4326)::geography,
       v.apres, true, v.termos
from municipio m
cross join (values
  ('E.M. Mapa Verde', 'em-mapa-verde', 'Municipal', -46.8015, -24.1875,
   'Escola fictícia de demonstração. Monitora um trecho de praia aberta.', true),
  ('E.M. Maré Cheia', 'em-mare-cheia', 'Municipal', -46.7645, -24.1735,
   'Escola fictícia de demonstração. Monitora um trecho de praia com saídas quinzenais.', true),
  ('E.E. Costa Viva', 'ee-costa-viva', 'Estadual',  -46.7885, -24.1830,
   'Escola fictícia de demonstração. Monitora praia central e foz de rio.', true),
  ('E.M. Duna Alta',  'em-duna-alta',  'Municipal', -46.8220, -24.2005,
   'Escola fictícia de demonstração. Monitora resíduos e microplásticos.', false)
) as v(nome, slug, rede, lng, lat, apres, termos)
where m.nome = 'Itanhaém' and m.uf = 'SP'
  and not exists (select 1 from escola e where e.slug = v.slug);

insert into turma (escola_id, nome, ano_letivo, nivel)
select e.id, t.nome, 2026, 'Fundamental II'
from escola e
cross join (values ('6º ano A'), ('7º ano B')) as t(nome)
where e.slug in ('em-mapa-verde','em-mare-cheia','ee-costa-viva','em-duna-alta')
  and not exists (
    select 1 from turma x
    where x.escola_id = e.id and x.nome = t.nome and x.ano_letivo = 2026
  );

-- ---------------------------------------------------------------------
-- Expedicoes
-- ---------------------------------------------------------------------

insert into expedicao (escola_id, turma_id, numero, titulo, data_campo,
                       hora_inicio, hora_fim, extensao_m, n_mapeadores, n_equipes,
                       mare, chuva_24h, status)
select e.id,
       (select min(t.id) from turma t where t.escola_id = e.id),
       v.numero, v.titulo, v.data_campo::date,
       '08:30'::time, '11:30'::time, v.extensao, v.mapeadores, 2,
       v.mare, 'nao', 'publicado'
from escola e
join (values
  ('em-mapa-verde', 1, 'Mapeamento da faixa norte',   '2026-05-12', 200.00, 24, 'baixamar'),
  ('em-mapa-verde', 2, 'Mapeamento da faixa central', '2026-06-09', 200.00, 22, 'vazante'),
  ('em-mapa-verde', 3, 'Coleta de microplásticos',    '2026-06-23', 200.00, 18, 'baixamar'),
  ('em-mapa-verde', 4, 'Registro de ocorrências',     '2026-07-14', 200.00, 20, 'enchente'),
  ('em-mare-cheia', 1, 'Primeira saída do ano',       '2026-04-14', 200.00, 26, 'baixamar'),
  ('em-mare-cheia', 2, 'Faixa sul da praia',          '2026-05-19', 200.00, 24, 'vazante'),
  ('em-mare-cheia', 3, 'Registro de ocorrências',     '2026-06-16', 200.00, 21, 'baixamar'),
  ('ee-costa-viva', 1, 'Praia central',               '2026-05-05', 150.00, 30, 'vazante'),
  ('ee-costa-viva', 2, 'Microplásticos na foz',       '2026-06-02', 150.00, 16, 'baixamar'),
  ('ee-costa-viva', 3, 'Registro de ocorrências',     '2026-06-30', 150.00, 28, 'enchente'),
  ('em-duna-alta',  1, 'Trecho das dunas',            '2026-06-11', 200.00, 19, 'baixamar'),
  ('em-duna-alta',  2, 'Registro de ocorrências',     '2026-07-08', 200.00, 17, 'vazante')
) as v(slug, numero, titulo, data_campo, extensao, mapeadores, mare)
  on v.slug = e.slug
where not exists (
  select 1 from expedicao x where x.escola_id = e.id and x.numero = v.numero
);

-- ---------------------------------------------------------------------
-- Unidades amostrais: tres por celula, deslocadas em metros no CRS
-- projetado para cairem no mesmo vertice da grade de 100 m
-- ---------------------------------------------------------------------

insert into unidade_amostral (expedicao_id, versao_id, tipo, ordem, geom,
                              comprimento_m, largura_m, area_m2,
                              profundidade_cm, malha_mm, metadados)
select x.id,
       pv.id,
       c.tipo::tipo_unidade_amostral,
       d.ordem,
       -- Ancora no vertice da grade antes de deslocar. Deslocar em torno
       -- de um centro solto reparte as tres unidades entre celulas
       -- vizinhas quando o centro cai perto da divisa, e o piso de tres
       -- suprime as duas metades.
       st_transform(
         st_translate(
           st_snaptogrid(
             st_transform(st_setsrid(st_makepoint(c.lng, c.lat), 4326), 31983),
             100),
           d.dx, d.dy),
         4326)::geography,
       case when c.protocolo = 'RES' then 50.0 else 0.5 end,
       case when c.protocolo = 'RES' then  2.0 else 0.5 end,
       c.area_unidade,
       case when c.protocolo = 'MIC' then 5.0 end,
       case when c.protocolo = 'MIC' then 1.0 end,
       jsonb_build_object('celula', c.celula, 'seed', 'piloto_ficticio')
from (values
  ('a1', 'em-mapa-verde', 1, 'RES', -46.8010, -24.1890, 'trecho',  100.0000, 30),
  ('a2', 'em-mapa-verde', 1, 'RES', -46.7990, -24.1895, 'trecho',  100.0000, 18),
  ('a3', 'em-mapa-verde', 2, 'RES', -46.8030, -24.1888, 'trecho',  100.0000, 40),
  ('a4', 'em-mapa-verde', 3, 'MIC', -46.8050, -24.1892, 'quadrat',   0.2500, 62),
  ('b1', 'em-mare-cheia', 1, 'RES', -46.7640, -24.1750, 'trecho',  100.0000, 12),
  ('b2', 'em-mare-cheia', 1, 'RES', -46.7620, -24.1755, 'trecho',  100.0000, 20),
  ('b3', 'em-mare-cheia', 2, 'RES', -46.7660, -24.1748, 'trecho',  100.0000, 35),
  ('c1', 'ee-costa-viva', 1, 'RES', -46.7880, -24.1835, 'trecho',  100.0000, 44),
  ('c2', 'ee-costa-viva', 1, 'RES', -46.7860, -24.1840, 'trecho',  100.0000, 27),
  ('c3', 'ee-costa-viva', 2, 'MIC', -46.7900, -24.1838, 'quadrat',   0.2500, 38),
  ('d1', 'em-duna-alta',  1, 'RES', -46.8215, -24.2010, 'trecho',  100.0000, 14),
  ('d2', 'em-duna-alta',  1, 'RES', -46.8235, -24.2015, 'trecho',  100.0000,  9)
) as c(celula, slug, numero, protocolo, lng, lat, tipo, area_unidade, qtd_unidade)
join escola e            on e.slug = c.slug
join expedicao x         on x.escola_id = e.id and x.numero = c.numero
join protocolo p         on p.codigo = c.protocolo
join protocolo_versao pv on pv.protocolo_id = p.id and pv.ativa
cross join (values (1, -20.0, -15.0), (2, 0.0, 0.0), (3, 18.0, 12.0)) as d(ordem, dx, dy)
where not exists (
  select 1 from unidade_amostral u where u.metadados->>'celula' = c.celula
);

-- ---------------------------------------------------------------------
-- Contagens: RES aponta para item de lista, MIC para campo de ficha
-- ---------------------------------------------------------------------

insert into observacao_contagem (unidade_id, item_id, campo_id, quantidade)
select u.id,
       case when u.tipo = 'trecho' then (
         select pi.id from protocolo_item pi
         where pi.versao_id = u.versao_id order by pi.ordem limit 1
       ) end,
       case when u.tipo = 'quadrat' then (
         select pc.id from protocolo_campo pc
         join protocolo_secao ps on ps.id = pc.secao_id
         where ps.versao_id = u.versao_id and pc.codigo = 'fragmento'
       ) end,
       q.qtd_unidade
from unidade_amostral u
join (values
  ('a1', 30), ('a2', 18), ('a3', 40), ('a4', 62),
  ('b1', 12), ('b2', 20), ('b3', 35),
  ('c1', 44), ('c2', 27), ('c3', 38),
  ('d1', 14), ('d2',  9)
) as q(celula, qtd_unidade) on q.celula = u.metadados->>'celula'
where not exists (
  select 1 from observacao_contagem oc where oc.unidade_id = u.id
);

-- ---------------------------------------------------------------------
-- Registros pontuais, na ultima expedicao de cada escola
-- ---------------------------------------------------------------------

insert into observacao_pontual (expedicao_id, versao_id, descricao, geom, origem_provavel)
select x.id, pv.id, o.descricao,
       st_transform(
         st_translate(st_transform(e.geom::geometry, 31983), o.dx, o.dy),
         4326)::geography,
       o.origem
from escola e
join expedicao x on x.escola_id = e.id
              and x.numero = (select max(y.numero) from expedicao y where y.escola_id = e.id)
join protocolo p on p.codigo = 'RES'
join protocolo_versao pv on pv.protocolo_id = p.id and pv.ativa
cross join (values
  ('Rede de pesca abandonada', 'pesca',     120.0,  -80.0),
  ('Pneu semienterrado',       'descarte', -140.0,   90.0),
  ('Acúmulo junto ao córrego', 'drenagem',   60.0,  150.0)
) as o(descricao, origem, dx, dy)
where not exists (
  select 1 from observacao_pontual op where op.expedicao_id = x.id
);
