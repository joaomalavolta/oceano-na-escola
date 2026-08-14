-- =====================================================================
-- Oceano na Escola — a escola declara se tem coordenada
--
-- A tela de análise precisa saber se a escola tem posição antes de o
-- admin clicar em aprovar: aprovar sem coordenada é recusado por
-- admin_aprova_escola(), e descobrir isso só depois do clique é ruim
-- de usar.
--
-- A geometria não atravessa o PostgREST em formato utilizável, e a
-- coordenada existente vem por RPC, uma escola por vez — numa lista
-- seriam N chamadas. Uma coluna gerada responde a pergunta em uma.
--
-- Não serve como permissão: quem decide continua sendo a função no
-- banco. Isto é o aviso que a tela mostra antes.
-- =====================================================================

alter table escola
  add column if not exists tem_coordenada boolean
  generated always as (geom is not null) stored;

comment on column escola.tem_coordenada is
  'Só para a tela de análise saber, sem trazer a geometria, se a escola pode ir ao mapa.';
