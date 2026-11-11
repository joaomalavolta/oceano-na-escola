-- =====================================================================
-- Oceano na Escola — Guardiões Ecosurf
--
-- Complemento do programa: escolas de surf entram na mesma plataforma,
-- com os mesmos protocolos e o mesmo mapa. O que muda não é o método, é
-- quem aplica e com que frequência.
--
-- Uma escola regular faz saídas pontuais, planejadas, com turma, equipes
-- e trecho medido. Uma escola de surf está na água quase todo dia, e o
-- instrutor vê, em dois meses, mais vezes aquele pedaço de praia do que
-- uma turma inteira num ano letivo. É essa frequência o que o programa
-- ganha — e ela se perde se o único jeito de registrar for montar uma
-- expedição completa.
--
-- Daí os dois conceitos deste arquivo:
--
--   escola.tipo   — regular ou surf. A organização participante é a
--                   mesma entidade: vínculo, análise de cadastro,
--                   protocolos, curadoria de foto e mapa já funcionam, e
--                   duplicar isso numa tabela paralela criaria dois
--                   lugares para consertar cada regra de privacidade.
--
--   expedicao.tipo — expedicao ou sessao. A sessão É uma expedição, e
--                   não uma tabela nova. Ocorrência, evidência, pedido
--                   de remoção, views públicas e RLS todos penduram em
--                   expedicao_id; uma tabela paralela obrigaria a mexer
--                   em cada um deles, e cada lugar mexido é um lugar
--                   onde a foto de uma criança pode escapar.
--
-- O que a sessão não tem: equipe, unidade amostral, trecho medido,
-- transcrição. Ela produz ocorrência pontual — pino no mapa — e não
-- densidade. Quem quiser densidade faz expedição, inclusive a escola de
-- surf.
-- =====================================================================

create type tipo_organizacao as enum ('regular', 'surf');
create type tipo_registro    as enum ('expedicao', 'sessao');

alter table escola
  add column if not exists tipo tipo_organizacao not null default 'regular';

comment on column escola.tipo is
  'Escola regular ou escola de surf (Guardiões Ecosurf). Muda o vocabulário da interface, o pino no mapa e os materiais — não muda os protocolos.';

alter table expedicao
  add column if not exists tipo tipo_registro not null default 'expedicao';

comment on column expedicao.tipo is
  'Expedição completa ou sessão de Guardião. A sessão não tem equipe nem trecho medido: produz ocorrência pontual, não densidade.';

create index if not exists expedicao_por_tipo on expedicao (escola_id, tipo);

-- O cliente escolhe o tipo ao cadastrar, e não depois: trocar o tipo de
-- uma organização que já tem dado publicado mudaria o sentido do que
-- está no mapa.
grant insert (tipo) on escola to authenticated;
grant insert (tipo) on expedicao to authenticated;

-- ---------------------------------------------------------------------
-- Publicar uma sessão
-- ---------------------------------------------------------------------

/*
  Sobe a escada inteira de uma vez, um degrau por vez.

  A regra de transição continua intacta: rascunho → enviado → revisado →
  validado → publicado, um degrau por update, e é o gatilho que confere.
  Esta função não a afrouxa — ela dá os quatro passos por dentro, na
  mesma transação, e cada um passa pelo gatilho como qualquer outro.

  Tentei antes deixar a sessão pular direto para publicado, e desisti: o
  salto precisaria de uma exceção dentro do gatilho, e uma exceção ali
  vale para tudo o que um dia escrever `tipo = 'sessao'` — inclusive
  para um erro de digitação numa expedição de verdade.

  O que justifica subir de uma vez é que, na sessão, as quatro etapas
  acontecem no mesmo instante e na mesma pessoa. Não há ficha de papel
  para transcrever, nem equipe cujo trabalho outra pessoa confira: o
  instrutor viu, fotografou, marcou a coordenada e confirmou. Ele é o
  autor e o validador, e o carimbo de validação registra isso com o
  nome dele.

  O que a sessão NÃO pula: a escola precisa estar aprovada e publicada
  para o dado chegar ao mapa, a foto precisa de termo e curadoria para
  entrar na galeria, e o pedido de remoção vale igual.
*/
create or replace function publicar_sessao(p_expedicao_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_escola bigint;
  v_tipo   tipo_registro;
  v_status status_dado;
  v_tem    boolean;
begin
  select escola_id, tipo, status into v_escola, v_tipo, v_status
    from expedicao where id = p_expedicao_id;

  if not found then
    raise exception 'Sessão não encontrada.' using errcode = 'P0002';
  end if;

  if not app_tem_vinculo(v_escola) then
    raise exception 'Só quem responde pela escola publica a sessão dela.'
      using errcode = '42501';
  end if;

  if v_tipo <> 'sessao' then
    raise exception 'Isto é uma expedição, e expedição passa pela revisão etapa por etapa.'
      using errcode = '23514';
  end if;

  if v_status = 'publicado' then
    return;  -- Idempotente: dois toques no botão não viram erro.
  end if;

  if v_status <> 'rascunho' then
    raise exception 'Esta sessão já saiu do rascunho. Continue pela tela de revisão.'
      using errcode = '23514';
  end if;

  -- Sessão sem nada registrado não tem o que publicar, e o gatilho de
  -- transição recusaria no último degrau com mensagem sobre expedição.
  -- Melhor falar de sessão, que é o que a pessoa está vendo.
  select exists (select 1 from observacao_pontual o where o.expedicao_id = p_expedicao_id)
    into v_tem;
  if not v_tem then
    raise exception 'Registre pelo menos uma ocorrência antes de publicar a sessão.'
      using errcode = '23514';
  end if;

  update expedicao set status = 'enviado'   where id = p_expedicao_id;
  update expedicao set status = 'revisado'  where id = p_expedicao_id;
  update expedicao set status = 'validado'  where id = p_expedicao_id;
  update expedicao set status = 'publicado' where id = p_expedicao_id;
end;
$$;

comment on function publicar_sessao(bigint) is
  'Publica uma sessão de Guardião subindo a escada de status um degrau por vez. Não afrouxa a regra de transição: dá os quatro passos por dentro.';

grant execute on function publicar_sessao(bigint) to authenticated;
revoke execute on function publicar_sessao(bigint) from anon, public;

-- ---------------------------------------------------------------------
-- O mapa precisa saber de que tipo é cada ponto
-- ---------------------------------------------------------------------

-- Sem o tipo na view, o mapa desenharia escola de surf e escola regular
-- com o mesmo pino, e quem olha não saberia que aquele ponto é um
-- Guardião — que é metade do que o programa quer mostrar.
--
-- A coluna nova entra no FIM, e não onde faria sentido ler. `create or
-- replace view` recusa inserir coluna no meio, e derrubar estas duas
-- views para recriá-las arriscaria o mapa inteiro por uma questão de
-- ordem que a aplicação nem enxerga: ela seleciona por nome.
create or replace view pub_escola with (security_invoker = off) as
select e.id,
       e.slug,
       e.nome,
       e.apresentacao,
       m.nome as municipio,
       m.uf,
       st_y(e.geom::geometry) as lat,
       st_x(e.geom::geometry) as lng,
       e.tipo
from escola e
join municipio m on m.id = e.municipio_id
where e.publicada = true
  and e.geom is not null;

-- A ocorrência diz de onde veio. Uma marcação de sessão e uma de
-- expedição valem o mesmo como dado, mas não foram produzidas do mesmo
-- jeito, e quem for usar o dado aberto precisa poder separar as duas.
create or replace view pub_observacao_pontual with (security_invoker = off) as
select op.id,
       e.slug  as escola_slug,
       e.nome  as escola_nome,
       p.codigo as protocolo,
       p.nome   as protocolo_nome,
       p.icone  as protocolo_icone,
       p.cor    as protocolo_cor,
       pi.codigo   as item_codigo,
       pi.nome     as item_nome,
       pi.grupo    as item_grupo,
       pi.icone    as item_icone,
       pi.unidade  as item_unidade,
       op.valor,
       op.descricao,
       op.origem_provavel,
       x.numero as expedicao_numero,
       x.data_campo,
       st_asgeojson(op.geom::geometry) as ponto_geojson,
       e.tipo as escola_tipo,
       x.tipo as registro_tipo
from observacao_pontual op
join expedicao x on x.id = op.expedicao_id and x.status = 'publicado'
join escola e    on e.id = x.escola_id and e.publicada = true
join protocolo_versao pv on pv.id = op.versao_id
join protocolo p on p.id = pv.protocolo_id
left join protocolo_item pi on pi.id = op.item_id;

grant select on pub_escola, pub_observacao_pontual to anon, authenticated;
