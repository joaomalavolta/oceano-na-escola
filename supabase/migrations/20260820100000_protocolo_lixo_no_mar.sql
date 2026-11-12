/*
  Protocolo de ocorrência: Lixo no mar (LIM).

  Até aqui não havia como marcar lixo como ponto no celular. RES é
  contagem por área, na ficha, e fica fora do registro em campo de
  propósito — contagem sem área não vira densidade. Quem queria marcar
  um ponto de lixo usava "Descarte irregular", que é sobre entulho e
  lixo urbano, e os dois dados se misturavam.

  LIM é o lixo no mar e na beira dele, registrado por ponto, com foto.
  As escolas de surf o veem de dentro d'água; as escolas, da areia e da
  foz. Não substitui RES: RES mede quanto há por metro quadrado num
  trecho; LIM diz onde está o que foi visto.

  Itens: os cinco propostos e aceitos pelo Instituto Ecosurf em
  12/11/2026. A interação de fauna com lixo continua em AVI ("Fauna
  interagindo com resíduo"), para não haver dois lugares para o mesmo
  registro. Item novo entra por cadastro, sem migration.

  Ainda EM DEFINIÇÃO, e por isso em branco, sem nada inventado no lugar:

    - a magnitude (quantidade estimada, volume ou só presença com o
      material predominante): `unidade` fica nula, e o registro é de
      presença até a decisão;
    - o método de campo, com as regras de segurança: `metodo` fica nulo
      até o texto ser aprovado.

  Cor #827200 (oliva, oklch 0.55 0.12 100): a única faixa de matiz livre
  na paleta categórica, entre esgoto (laranja) e restinga (verde). Dá
  4,8:1 com o glifo branco, acima do piso de 3:1 da paleta.
*/

insert into protocolo (codigo, nome, descricao, icone, cor, unidade_medida, forma_agregacao)
values (
  'LIM',
  'Lixo no mar',
  'Lixo no mar e na beira dele, registrado por ponto e com foto: flutuante, acumulado na linha de maré, petrecho de pesca abandonado, lixo na foz e concentração de pellets.',
  'lixo-mar',
  '#827200',
  null,
  'ocorrencia'
)
on conflict (codigo) do nothing;

insert into protocolo_versao (protocolo_id, versao, metodo, ativa, publicada_em)
select p.id, '1.0', null, true, now()
  from protocolo p
 where p.codigo = 'LIM'
   and not exists (select 1 from protocolo_versao v where v.protocolo_id = p.id);

insert into protocolo_secao (versao_id, codigo, nome, ordem)
select v.id, s.codigo, s.nome, s.ordem
  from protocolo p
  join protocolo_versao v on v.protocolo_id = p.id
 cross join (values
   ('ocorrencia',  'Ocorrências registradas', 1),
   ('qualitativo', 'Observações da equipe',   2)
 ) as s(codigo, nome, ordem)
 where p.codigo = 'LIM'
   and not exists (select 1 from protocolo_secao ps where ps.versao_id = v.id and ps.codigo = s.codigo);

insert into protocolo_item (versao_id, codigo, nome, grupo, ordem, icone, unidade)
select v.id, i.codigo, i.nome, i.grupo, i.ordem, i.icone, null
  from protocolo p
  join protocolo_versao v on v.protocolo_id = p.id
  join (values
    ('LIM01', 'Lixo flutuante na água',                          'Na água',       1, 'flutuante'),
    ('LIM02', 'Acúmulo de lixo na linha de maré',                'Na praia',      2, 'linha-mare'),
    ('LIM03', 'Petrecho de pesca abandonado (rede, linha, armadilha)', 'Pesca',   3, 'petrecho'),
    ('LIM04', 'Lixo na foz de rio ou canal',                     'Foz',           4, 'foz'),
    ('LIM05', 'Concentração de pellets ou microplástico visível', 'Microplástico', 5, 'pellets')
  ) as i(codigo, nome, grupo, ordem, icone) on true
 where p.codigo = 'LIM'
   and not exists (select 1 from protocolo_item pi where pi.versao_id = v.id and pi.codigo = i.codigo);
