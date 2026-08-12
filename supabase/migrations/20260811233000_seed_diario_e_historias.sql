-- =====================================================================
-- Oceano na Escola — diário e histórias do piloto fictício
--
-- As abas de Diário e Histórias nasciam vazias, e aba vazia não mostra
-- o que se espera escrever nela. Estes textos são fictícios, como as
-- escolas e os territórios do piloto, e servem de modelo: o diário
-- registra o processo, a história diz o que os dados significam.
--
-- Escrito em primeira pessoa do plural, como turma escreve. O momento
-- "depois" é onde mora a pergunta central do projeto — o que estes
-- números dizem deste território, e de quem é a responsabilidade.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Diário de Campo — expedição 1, E.M. Mapa Verde
-- ---------------------------------------------------------------------

insert into diario_entrada (expedicao_id, momento, titulo, texto, autoria)
select x.id, v.momento::momento_campo, v.titulo, v.texto, v.autoria
from expedicao x
cross join (values
  ('antes',
   'O que a gente acha que vai encontrar',
   'Antes de sair, a turma listou o que esperava achar na faixa norte: garrafa PET, canudo, tampinha, bituca. Quase todo mundo apostou que plástico seria a maioria.

Duas perguntas ficaram anotadas no quadro para a gente responder depois:

Por que tem mais lixo perto da saída da rua do que no meio da praia?
De onde vem o isopor, se ninguém aqui usa isopor na praia?',
   '7º ano B'),
  ('durante',
   'O que apareceu no caminho',
   'A maré estava vazando e a faixa de areia ficou larga. Dividimos em três equipes, cada uma com 50 metros.

A equipe E2 achou uma concentração grande de fragmentos duros perto da saída de água pluvial. A equipe E3, que pegou o trecho mais afastado, encontrou bem menos coisa — mas achou dois pedaços grandes de isopor, do tamanho de uma caixa.

Um pescador que estava consertando a rede parou para conversar. Ele disse que o isopor vem das caixas de pesca que se quebram e que, quando chove forte, "desce tudo pelo rio". Anotamos.',
   '7º ano B — equipes E1, E2 e E3'),
  ('depois',
   'O que estes números dizem',
   'Contamos 347 itens em 300 m². Plástico foi 61% do total, o que a turma tinha previsto. Mas o que ninguém tinha previsto foi a diferença entre os trechos: o trecho perto da drenagem teve quase o triplo de itens do trecho afastado, com a mesma área amostrada.

Isso muda a pergunta. Não é "as pessoas sujam a praia" — é "a água traz o lixo da cidade para a praia". O que o pescador falou bate com o que a contagem mostrou.

Se a origem é a drenagem, a responsabilidade não é só de quem vai à praia no fim de semana. É de quem joga lixo na rua a três quilômetros daqui, e é de quem tem que limpar as bocas de lobo antes da chuva. A turma decidiu levar esse resultado para a reunião do conselho de escola e pedir uma conversa com a prefeitura sobre a limpeza da drenagem antes do verão.',
   '7º ano B, com o professor de Ciências')
) as v(momento, titulo, texto, autoria)
join escola e on e.id = x.escola_id
where e.slug = 'em-mapa-verde' and x.numero = 1
  and not exists (select 1 from diario_entrada d where d.expedicao_id = x.id);

-- ---------------------------------------------------------------------
-- Diário de Campo — expedição 1, E.M. Maré Cheia
-- ---------------------------------------------------------------------

insert into diario_entrada (expedicao_id, momento, titulo, texto, autoria)
select x.id, v.momento::momento_campo, v.titulo, v.texto, v.autoria
from expedicao x
cross join (values
  ('antes',
   'Combinados antes de sair',
   'Revisamos a ficha e o protocolo de resíduos. Cada equipe ficou responsável por um trecho de 50 metros e por não misturar a contagem com a da equipe vizinha.

Combinamos também o que não fazer: não pegar nada cortante, não entrar na água, não fotografar rosto de ninguém. A foto é do lugar, não das pessoas.',
   '8º ano A'),
  ('depois',
   'A pergunta que sobrou',
   'A densidade deu 0,29 item por metro quadrado. Quando comparamos com a saída anterior, no mesmo trecho, o número caiu um pouco — mas a quantidade de fragmentos pequenos aumentou.

A turma discutiu se isso é uma boa notícia. A conclusão foi que não necessariamente: pode ser que o lixo grande esteja se quebrando em pedaços menores em vez de estar indo embora. Fragmento pequeno é mais difícil de recolher e é o que vira microplástico.

Ficou combinado repetir a medição no mesmo trecho depois das chuvas de dezembro, para ver se a tendência se confirma. Uma medição não faz uma série.',
   '8º ano A')
) as v(momento, titulo, texto, autoria)
join escola e on e.id = x.escola_id
where e.slug = 'em-mare-cheia' and x.numero = 1
  and not exists (select 1 from diario_entrada d where d.expedicao_id = x.id);

-- ---------------------------------------------------------------------
-- Histórias do Território
-- ---------------------------------------------------------------------

with nova as (
  insert into historia (escola_id, slug, titulo, resumo, corpo, publicada)
  select e.id,
         'o-lixo-nao-vem-do-mar',
         'O lixo não vem do mar',
         'Três equipes mediram a mesma praia em trechos diferentes e descobriram que a distância até a drenagem explica quase tudo.',
         'Quando a turma começou a monitorar a faixa norte, a hipótese era a mais comum: o lixo da praia vem do mar, trazido pela maré, ou fica ali porque as pessoas deixam no fim de semana.

A primeira expedição já mostrou outra coisa.

Dividimos 150 metros de praia em três trechos de 50, e cada equipe contou o seu, com a mesma área amostrada e a mesma ficha. O trecho mais perto da saída de água pluvial teve quase o triplo de itens do trecho mais afastado. Não era uma diferença pequena, dessas que podem ser erro de contagem: era o triplo.

Plástico foi 61% de tudo o que encontramos. Mas o que explicou a distribuição não foi o tipo de material — foi a distância até a drenagem.

**O que um pescador nos contou**

Enquanto contávamos, um pescador que consertava a rede parou para conversar. Ele falou do isopor: vem das caixas de pesca que se quebram, e quando chove forte "desce tudo pelo rio". A gente tinha anotado essa frase no diário sem saber que ela ia se encaixar com o número.

Encaixou. O que a contagem mostrou e o que ele disse contam a mesma história: a praia recebe o que a cidade manda pela água.

**Por que isso muda a pergunta**

Se o lixo viesse do mar, a resposta seria limpar a praia. Se ele desce pela drenagem, limpar a praia é enxugar gelo — o material volta na próxima chuva.

A responsabilidade também muda de lugar. Deixa de ser só de quem vai à praia no fim de semana e passa a ser de quem joga lixo na rua a três quilômetros daqui, e de quem precisa limpar as bocas de lobo antes do verão.

**O que a turma vai fazer**

Levamos o resultado para a reunião do conselho de escola e pedimos uma conversa com a prefeitura sobre a limpeza da drenagem antes das chuvas de dezembro.

E vamos medir de novo, no mesmo trecho, depois delas. Uma medição mostra um retrato. É a série que mostra se alguma coisa mudou.',
         true
  from escola e
  where e.slug = 'em-mapa-verde'
    and not exists (select 1 from historia h where h.escola_id = e.id and h.slug = 'o-lixo-nao-vem-do-mar')
  returning id, escola_id
)
insert into historia_expedicao (historia_id, expedicao_id)
select n.id, x.id
from nova n
join expedicao x on x.escola_id = n.escola_id and x.numero in (1, 2);

with nova as (
  insert into historia (escola_id, slug, titulo, resumo, corpo, publicada)
  select e.id,
         'o-numero-caiu-mas-nao-e-boa-noticia',
         'O número caiu, mas não é boa notícia',
         'A densidade de resíduos diminuiu entre duas saídas. A quantidade de fragmentos pequenos aumentou. A turma discutiu o que isso quer dizer.',
         'Na segunda saída ao mesmo trecho, a densidade deu 0,29 item por metro quadrado — um pouco menos que na primeira. Seria fácil comemorar.

A turma não comemorou, e o motivo está na ficha.

Quando separamos a contagem por tipo, o que diminuiu foram os itens grandes: garrafa, embalagem, sacola. O que aumentou foram os fragmentos duros pequenos, aqueles pedaços que já não dá para saber de que objeto vieram.

**Duas explicações possíveis**

A primeira é que o lixo grande foi recolhido ou levado pela maré, e a praia está de fato mais limpa.

A segunda é que o lixo grande continua ali, só que quebrado. Sol, areia e ondas partem o plástico em pedaços cada vez menores. O item some da contagem de resíduos e reaparece, mais tarde, na contagem de microplásticos — onde é muito mais difícil de recolher.

**Por que não dá para decidir agora**

Com duas medições, não dá para saber qual das duas explicações está certa. Por isso combinamos repetir no mesmo trecho depois das chuvas de dezembro, e olhar as duas contagens juntas: a de resíduos e a de microplásticos.

Foi a lição mais importante desta expedição, e ela não é sobre a praia: um número sozinho não diz quase nada. É a série que fala.',
         true
  from escola e
  where e.slug = 'em-mare-cheia'
    and not exists (select 1 from historia h where h.escola_id = e.id and h.slug = 'o-numero-caiu-mas-nao-e-boa-noticia')
  returning id, escola_id
)
insert into historia_expedicao (historia_id, expedicao_id)
select n.id, x.id
from nova n
join expedicao x on x.escola_id = n.escola_id and x.numero in (1, 2);
