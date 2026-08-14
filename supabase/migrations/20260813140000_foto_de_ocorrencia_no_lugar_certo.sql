-- ---------------------------------------------------------------------
-- A foto de ocorrência volta para o lugar em que foi tirada
-- ---------------------------------------------------------------------
--
-- Duas coisas, e a segunda é consequência da primeira.
--
-- 1. A COORDENADA. Quando esta view nasceu, a regra de precisão era uma
--    só e tudo ia agregado em 100 m. A v0.3 das premissas dividiu a
--    regra: esforço amostral continua agregado, porque aquela coordenada
--    diz onde as crianças estiveram; ocorrência ambiental passa a ter
--    coordenada exata, porque descreve o território e não a turma — "um
--    problema ambiental que não se pode apontar não se pode cobrar", e a
--    premissa diz com todas as letras que a foto que documenta a
--    ocorrência aparece no lugar em que está. A view da ocorrência foi
--    atualizada; esta ficou para trás, ainda arredondando.
--
-- 2. O CASAMENTO COM A OCORRÊNCIA. A interface liga foto e ocorrência
--    comparando o texto do GeoJSON, e com uma view arredondando e a
--    outra não, as duas strings nunca batiam: medido nos dados do
--    piloto, de 21 a 42 metros de diferença. O popup do mapa da escola
--    tinha suporte a foto que nunca podia disparar.
--
--    Comparar coordenada em texto era frágil de qualquer forma — basta
--    uma casa decimal a mais na formatação para nada casar. A view passa
--    a expor `pontual_id`, e a ligação vira o que sempre foi: identidade.
--
-- O que NÃO muda: seguem exigidas as três condições da premissa —
-- curadoria do professor (`status = 'publicada'`), escola publicada e
-- termo de uso de imagem confirmado. E a foto continua fora dos
-- buscadores, servida com noindex.

drop view if exists pub_foto_georreferenciada;
create view pub_foto_georreferenciada with (security_invoker = off) as
select
  ev.id,
  op.id    as pontual_id,
  ev.storage_path,
  ev.legenda,
  ev.publicada_em,
  e.slug   as escola_slug,
  e.nome   as escola_nome,
  p.codigo as protocolo,
  p.icone  as protocolo_icone,
  p.cor    as protocolo_cor,
  op.descricao      as ocorrencia,
  op.origem_provavel,
  x.numero as expedicao_numero,
  date_trunc('month', x.data_campo)::date as mes,
  st_asgeojson(op.geom::geometry) as ponto_geojson
from evidencia ev
join observacao_pontual op on op.id = ev.pontual_id
join expedicao x           on x.id = op.expedicao_id and x.status = 'publicado'
join escola e              on e.id = ev.escola_id and e.publicada = true and e.termos_ok = true
join protocolo_versao pv   on pv.id = op.versao_id
join protocolo p           on p.id = pv.protocolo_id
where ev.status = 'publicada';

comment on view pub_foto_georreferenciada is
  'Foto de ocorrencia na coordenada exata, conforme premissas v0.3: a ocorrencia descreve o '
  'territorio, nao a turma. Servir com noindex, como a galeria. Exige curadoria, escola publicada '
  'e termo de uso de imagem confirmado. Use pontual_id para ligar a ocorrencia; comparar '
  'coordenada em texto e fragil e ja falhou uma vez.';

grant select on pub_foto_georreferenciada to anon, authenticated;
