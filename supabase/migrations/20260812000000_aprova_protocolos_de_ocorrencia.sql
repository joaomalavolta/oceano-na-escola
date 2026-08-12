-- =====================================================================
-- Oceano na Escola — aprovação dos protocolos de ocorrência
--
-- RST, ESG, DES, AVI e AGU entraram com o método em branco, marcado
-- "Rascunho para revisao do Instituto Ecosurf". Aprovados, eles ganham
-- o método de campo escrito — que é o que faltava de fato, porque
-- protocolo sem método não é protocolo, é lista de itens.
--
-- Os cinco são de ocorrência pontual, não de amostragem por área: o
-- aluno registra o que encontra no ponto em que está. Por isso o método
-- fala menos de esforço amostral e mais de como observar sem interferir
-- e sem se expor — que é o risco real destes cinco, e não o da contagem
-- de resíduos.
--
-- A versão continua 1.0. Os itens não mudaram, e subir a versão
-- desligaria o dado do piloto da definição que o gerou.
-- =====================================================================

update protocolo_versao pv
   set metodo = v.metodo
  from (values
  ('RST',
   'Percorrer o trecho de restinga definido para a expedição e registrar cada ocorrência no ponto em que ela está. A magnitude é a área afetada, em metros quadrados, medida com trena ou estimada por passos calibrados — o passo médio da turma é medido antes da saída. Fotografar sempre em duas escalas: o detalhe e o contexto, com um objeto de tamanho conhecido na imagem para dar referência. Não pisar dentro da área de vegetação preservada para medir: contornar e estimar da borda.'),
  ('ESG',
   'Percorrer a linha de drenagem, a foz ou a margem do córrego e registrar os pontos de lançamento e os indícios visíveis. Não coletar, não tocar na água e não descer a margem. Odor, coloração anômala e espuma são registrados como indício, cada um no seu ponto; a boca da tubulação é fotografada com referência de escala. A extensão de córrego com aspecto contaminado é estimada em metros ao longo da margem percorrida. Havendo contato acidental com a água, lavar com água limpa e comunicar o professor.'),
  ('DES',
   'Registrar cada foco de descarte no ponto em que está, sem recolher e sem revirar nada — resíduo de descarte irregular pode conter material cortante, químico ou de saúde. Entulho, volumoso e queima contam por ponto verificado; acúmulo em terreno é estimado em metros quadrados de área coberta. Não entrar em terreno particular: o registro é feito do limite público, e a descrição anota quando o ponto foi observado de fora. Queima ativa não se aproxima: registra-se à distância e comunica-se a autoridade.'),
  ('AVI',
   'Registro por avistamento, sem captura, sem manuseio e sem aproximação que provoque fuga ou abandono de ninho. Anotar o número de indivíduos observados e a espécie apenas quando a identificação for segura; na dúvida, descrever e fotografar em vez de nomear — nome errado no dado vale menos que descrição honesta. Ninho e área de reprodução são registrados à distância, sem foto aproximada e sem indicar trilha de acesso na descrição. Animal encalhado ou morto: não tocar, registrar, e comunicar o órgão ambiental responsável pelo trecho.'),
  ('AGU',
   'Medição pontual com o instrumento disponível, sempre no mesmo ponto e, quando possível, no mesmo horário e no mesmo estágio de maré — é a repetição nas mesmas condições que torna a série comparável. Registrar o valor lido e o instrumento usado na descrição da ocorrência. A água não é coletada nem levada para a escola. Esta medição acompanha variação ao longo do tempo e não substitui laudo: a comparação entre datas do mesmo ponto diz muito, e um valor isolado diz quase nada.')
) as v(codigo, metodo)
 where pv.protocolo_id = (select id from protocolo p where p.codigo = v.codigo)
   and pv.versao = '1.0';

-- O que cada protocolo é, para quem abre a lista sem conhecer o código.
update protocolo p
   set descricao = v.descricao
  from (values
  ('RST', 'Pressões sobre a vegetação de restinga: supressão, pisoteio, invasão biológica e aterro. A magnitude é a área afetada.'),
  ('ESG', 'Lançamentos e indícios de esgoto na drenagem, na foz e nos córregos que chegam à praia.'),
  ('DES', 'Descarte irregular de resíduo fora da praia: entulho, volumoso, queima e acúmulo em terreno.'),
  ('AVI', 'Avistamento de avifauna e fauna costeira, incluindo interação com resíduo e registro de encalhe.'),
  ('AGU', 'Medidas físico-químicas de acompanhamento da água, no mesmo ponto ao longo do tempo.')
) as v(codigo, descricao)
 where p.codigo = v.codigo;

-- pH é adimensional, e a unidade estava como texto vazio. Vazio faz a
-- tela esconder a magnitude, e o dado aparece sem número. 'pH' é o
-- rótulo que se lê bem no pin e na ficha.
update protocolo_item
   set unidade = 'pH'
 where codigo = 'AGU01' and coalesce(unidade, '') = '';

-- Unidade em branco em qualquer item tem o mesmo efeito. Nula é
-- diferente de vazia para a tela: nula some, vazia ocupa espaço.
update protocolo_item set unidade = null where trim(coalesce(unidade, '')) = '';
