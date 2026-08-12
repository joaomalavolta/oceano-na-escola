-- =====================================================================
-- Oceano na Escola — acentos do catálogo de protocolos
--
-- O catálogo inteiro foi semeado sem acento, e esse texto não fica
-- escondido: é o que aparece no painel de camadas do mapa público, na
-- legenda de densidade, na lista de ocorrências da página da escola, na
-- ficha impressa e nas colunas do CSV.
--
-- "Residuos costeiros e marinhos" numa plataforma de escola pública é
-- erro que o professor lê antes do aluno. Corrigido em português.
--
-- Só texto muda. Código, unidade, ícone, cor e ordem seguem iguais, e
-- por isso nada que aponta para estas linhas precisa saber da mudança.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Protocolos
-- ---------------------------------------------------------------------

update protocolo set nome = 'Qualidade da água'             where codigo = 'AGU';
update protocolo set nome = 'Microplásticos'                where codigo = 'MIC';
update protocolo set nome = 'Resíduos costeiros e marinhos' where codigo = 'RES';
update protocolo set nome = 'Restinga e vegetação costeira' where codigo = 'RST';

-- ---------------------------------------------------------------------
-- Itens
-- ---------------------------------------------------------------------

update protocolo_item set nome = v.nome
  from (values
    ('AVI01', 'Espécie avistada'),
    ('AVI02', 'Ninho ou área de reprodução'),
    ('AVI03', 'Fauna interagindo com resíduo'),
    ('BR01',  'Borracha, pneu ou câmara de ar'),
    ('DES01', 'Entulho de construção'),
    ('DES02', 'Móvel ou eletrodoméstico descartado'),
    ('DES03', 'Queima a céu aberto'),
    ('DES04', 'Acúmulo de resíduo em terreno'),
    ('ESG01', 'Ponto de lançamento em drenagem'),
    ('ESG02', 'Ligação irregular aparente'),
    ('ESG03', 'Espuma, odor ou coloração anômala'),
    ('ESG04', 'Córrego com aspecto contaminado'),
    ('MD01',  'Madeira processada, palito ou tábua'),
    ('MT01',  'Lata de alumínio'),
    ('MT02',  'Tampa metálica ou lacre'),
    ('PA01',  'Papel, papelão ou embalagem cartonada'),
    ('PL02',  'Sacola plástica'),
    ('PL06',  'Copo descartável'),
    ('PL09',  'Cotonete ou haste plástica'),
    ('PL13',  'Fragmento de plástico duro maior que 2,5 cm'),
    ('PL14',  'Chinelo, calçado ou brinquedo'),
    ('PL15',  'Máscara ou luva descartável'),
    ('PL16',  'Ponta ou pedaço de balão'),
    ('RST01', 'Supressão de vegetação de restinga'),
    ('RST03', 'Espécie exótica invasora'),
    ('RST04', 'Depósito de areia ou aterro'),
    ('SA01',  'Resíduo de saúde: seringa, agulha, medicamento')
  ) as v(codigo, nome)
 where protocolo_item.codigo = v.codigo;

-- Grupos: aparecem como cabeçalho na ficha e como coluna no relatório.
update protocolo_item set grupo = v.grupo
  from (values
    ('Fisico-quimico', 'Físico-químico'),
    ('Reproducao',     'Reprodução'),
    ('Interacao',      'Interação'),
    ('Ocorrencia',     'Ocorrência'),
    ('Plastico',       'Plástico'),
    ('Saude',          'Saúde'),
    ('Supressao',      'Supressão'),
    ('Degradacao',     'Degradação'),
    ('Invasao',        'Invasão'),
    ('Acumulo',        'Acúmulo'),
    ('Lancamento',     'Lançamento'),
    ('Indicio',        'Indício')
  ) as v(antigo, grupo)
 where protocolo_item.grupo = v.antigo;

-- ---------------------------------------------------------------------
-- Seções e campos da ficha
-- ---------------------------------------------------------------------

update protocolo_secao set nome = 'Esforço amostral'        where nome = 'Esforco amostral';
update protocolo_secao set nome = 'Ocorrências registradas' where nome = 'Ocorrencias registradas';
update protocolo_secao set nome = 'Observações da equipe'   where nome = 'Observacoes da equipe';

update protocolo_campo set rotulo = v.rotulo
  from (values
    ('Area de cada quadrat',                              'Área de cada quadrat'),
    ('Coordenada de inicio',                              'Coordenada de início'),
    ('O que mais chamou a atencao no trecho',             'O que mais chamou a atenção no trecho'),
    ('Observacoes da equipe',                             'Observações da equipe'),
    ('Havia saida de drenagem, corrego ou esgoto proximo','Havia saída de drenagem, córrego ou esgoto próximo'),
    ('Identificacao da equipe',                           'Identificação da equipe'),
    ('Filme (plastico mole, saco)',                       'Filme (plástico mole, saco)'),
    ('Largura media do trecho',                           'Largura média do trecho'),
    ('Numero de quadrats',                                'Número de quadrats'),
    ('Origem provavel',                                   'Origem provável'),
    ('Posicao na praia',                                  'Posição na praia')
  ) as v(antigo, rotulo)
 where protocolo_campo.rotulo = v.antigo;
