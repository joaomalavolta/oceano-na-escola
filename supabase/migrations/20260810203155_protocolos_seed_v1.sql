-- =====================================================================
-- Oceano na Escola — 20260810203155_protocolos_seed_v1.sql
-- Protocolo 01 (Resíduos costeiros) e 02 (Microplásticos), versão 1.0
-- =====================================================================

-- ---------------------------------------------------------------------
-- Protocolo 01 — Resíduos costeiros e marinhos
-- ---------------------------------------------------------------------

insert into protocolo (codigo, nome, descricao) values
('RES', 'Resíduos costeiros e marinhos',
 'Contagem de resíduos maiores que 2,5 cm em trecho de praia, com resultado em itens por m².');

insert into protocolo_versao (protocolo_id, versao, metodo, publicada_em)
select id, '1.0',
 'Trecho de 50 m por equipe, cobrindo toda a largura entre a linha d''água e o limite posterior. '
 'Recolhe e conta todo resíduo visível maior que 2,5 cm.',
 now()
from protocolo where codigo = 'RES';

insert into protocolo_secao (versao_id, codigo, nome, ordem)
select pv.id, s.codigo, s.nome, s.ordem
from protocolo_versao pv
join protocolo p on p.id = pv.protocolo_id and p.codigo = 'RES'
cross join (values
  ('esforco',    'Esforço amostral', 1),
  ('contagem',   'Contagem de itens', 2),
  ('pontual',    'Registro pontual', 3),
  ('qualitativo','Observações da equipe', 4)
) as s(codigo, nome, ordem);

insert into protocolo_campo (secao_id, codigo, rotulo, tipo, unidade, obrigatorio, valor_padrao, opcoes, ordem)
select sec.id, c.codigo, c.rotulo, c.tipo::tipo_campo, c.unidade, c.obrigatorio, c.valor_padrao, c.opcoes::jsonb, c.ordem
from protocolo_secao sec
join protocolo_versao pv on pv.id = sec.versao_id
join protocolo p on p.id = pv.protocolo_id and p.codigo = 'RES'
join (values
  ('esforco','equipe',       'Identificação da equipe','texto',      null, true,  null, null, 1),
  ('esforco','comprimento_m','Comprimento do trecho',  'decimal',    'm',  true,  '50', null, 2),
  ('esforco','largura_m',    'Largura média do trecho','decimal',    'm',  true,  null, null, 3),
  ('esforco','coord_inicio', 'Coordenada de início',   'coordenada', null, true,  null, null, 4),
  ('esforco','peso_kg',      'Peso total recolhido',   'decimal',    'kg', false, null, null, 5),
  ('pontual','origem',       'Origem provável',        'selecao',    null, true,  null,
    '["uso na praia","pesca","náutico","drenagem ou esgoto","descarte urbano","industrial","saúde","indefinido"]', 1),
  ('qualitativo','destaque', 'O que mais chamou a atenção no trecho','texto_longo', null, false, null, null, 1),
  ('qualitativo','drenagem', 'Havia saída de drenagem, córrego ou esgoto próximo','selecao', null, true, null,
    '["sim","não","não sei"]', 2),
  ('qualitativo','distribuicao','O lixo estava espalhado ou concentrado','selecao', null, true, null,
    '["espalhado","concentrado em pontos","misto"]', 3)
) as c(secao, codigo, rotulo, tipo, unidade, obrigatorio, valor_padrao, opcoes, ordem)
  on c.secao = sec.codigo;

insert into protocolo_item (versao_id, codigo, nome, grupo, ordem)
select pv.id, i.codigo, i.nome, i.grupo, i.ordem
from protocolo_versao pv
join protocolo p on p.id = pv.protocolo_id and p.codigo = 'RES'
cross join (values
  ('PL01','Bituca de cigarro','Plástico',1),
  ('PL02','Sacola plástica','Plástico',2),
  ('PL03','Garrafa PET','Plástico',3),
  ('PL04','Tampa ou tampinha','Plástico',4),
  ('PL05','Canudo','Plástico',5),
  ('PL06','Copo descartável','Plástico',6),
  ('PL07','Talher, prato ou mexedor','Plástico',7),
  ('PL08','Embalagem de salgadinho, biscoito ou bala','Plástico',8),
  ('PL09','Cotonete ou haste plástica','Plástico',9),
  ('PL10','Absorvente, fralda ou aplicador','Plástico',10),
  ('PL11','Linha, anzol ou isca de pesca','Plástico',11),
  ('PL12','Corda, cabo ou rede','Plástico',12),
  ('PL13','Fragmento de plástico duro maior que 2,5 cm','Plástico',13),
  ('PL14','Chinelo, calçado ou brinquedo','Plástico',14),
  ('PL15','Máscara ou luva descartável','Plástico',15),
  ('PL16','Ponta ou pedaço de balão','Plástico',16),
  ('EP01','Caixa, prato ou bandeja de isopor','Isopor e espumas',17),
  ('EP02','Fragmento de isopor maior que 2,5 cm','Isopor e espumas',18),
  ('EP03','Espuma ou esponja','Isopor e espumas',19),
  ('MT01','Lata de alumínio','Metal',20),
  ('MT02','Tampa metálica ou lacre','Metal',21),
  ('MT03','Outro metal','Metal',22),
  ('VD01','Garrafa de vidro','Vidro',23),
  ('VD02','Caco de vidro','Vidro',24),
  ('PA01','Papel, papelão ou embalagem cartonada','Papel',25),
  ('BR01','Borracha, pneu ou câmara de ar','Borracha',26),
  ('TX01','Tecido, roupa ou pano','Tecido',27),
  ('MD01','Madeira processada, palito ou tábua','Madeira',28),
  ('SA01','Resíduo de saúde: seringa, agulha, medicamento','Saúde',29),
  ('OU01','Outro (descrever)','Outros',30)
) as i(codigo, nome, grupo, ordem);

-- ---------------------------------------------------------------------
-- Protocolo 02 — Microplásticos
-- ---------------------------------------------------------------------

insert into protocolo (codigo, nome, descricao) values
('MIC', 'Microplásticos',
 'Contagem visual de partículas de 1 a 5 mm em quadrats de 0,25 m² na linha de deixa. '
 'Limite de detecção declarado: partículas menores que 1 mm exigem laboratório e não entram.');

insert into protocolo_versao (protocolo_id, versao, metodo, publicada_em)
select id, '1.0',
 '5 quadrats de 50 x 50 cm por equipe, espaçados a cada 10 m sobre a linha de deixa. '
 'Coleta dos 2 cm superficiais de sedimento, peneira de malha 1 mm, contagem visual da fração 1-5 mm.',
 now()
from protocolo where codigo = 'MIC';

insert into protocolo_secao (versao_id, codigo, nome, ordem)
select pv.id, s.codigo, s.nome, s.ordem
from protocolo_versao pv
join protocolo p on p.id = pv.protocolo_id and p.codigo = 'MIC'
cross join (values
  ('esforco',  'Esforço amostral', 1),
  ('quadrat',  'Contagem por quadrat', 2),
  ('qualitativo','Observações da equipe', 3)
) as s(codigo, nome, ordem);

insert into protocolo_campo (secao_id, codigo, rotulo, tipo, unidade, obrigatorio, valor_padrao, opcoes, ordem)
select sec.id, c.codigo, c.rotulo, c.tipo::tipo_campo, c.unidade, c.obrigatorio, c.valor_padrao, c.opcoes::jsonb, c.ordem
from protocolo_secao sec
join protocolo_versao pv on pv.id = sec.versao_id
join protocolo p on p.id = pv.protocolo_id and p.codigo = 'MIC'
join (values
  ('esforco','equipe',       'Identificação da equipe','texto',   null, true, null, null, 1),
  ('esforco','n_quadrats',   'Número de quadrats',     'inteiro', null, true, '5',   null, 2),
  ('esforco','area_quadrat', 'Área de cada quadrat',   'decimal', 'm2', true, '0.25',null, 3),
  ('esforco','profundidade', 'Profundidade coletada',  'decimal', 'cm', true, '2',   null, 4),
  ('esforco','malha',        'Malha da peneira',       'decimal', 'mm', true, '1',   null, 5),
  ('esforco','posicao',      'Posição na praia',       'selecao', null, true, 'linha de deixa',
    '["linha de deixa","faixa entre-marés","pós-praia seca","base da duna ou restinga"]', 6),
  ('esforco','coord_q1',     'Coordenada do primeiro quadrat','coordenada', null, true, null, null, 7),
  ('quadrat','fragmento',    'Fragmento duro',         'inteiro', null, true, '0', null, 1),
  ('quadrat','pellet',       'Pellet (esfera ou disco industrial)','inteiro', null, true, '0', null, 2),
  ('quadrat','isopor',       'Isopor ou espuma',       'inteiro', null, true, '0', null, 3),
  ('quadrat','filme',        'Filme (plástico mole, saco)','inteiro', null, true, '0', null, 4),
  ('quadrat','filamento',    'Filamento ou fio',       'inteiro', null, true, '0', null, 5),
  ('quadrat','outro',        'Outro',                  'inteiro', null, true, '0', null, 6),
  ('qualitativo','destaque', 'Observações da equipe',  'texto_longo', null, false, null, null, 1)
) as c(secao, codigo, rotulo, tipo, unidade, obrigatorio, valor_padrao, opcoes, ordem)
  on c.secao = sec.codigo;
