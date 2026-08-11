-- =====================================================================
-- Oceano na Escola — transição de status e prévia da grade
--
-- A revisão é a etapa que leva o dado da escola ao mapa público. Duas
-- coisas precisam existir no banco para que a tela de revisão seja mais
-- do que botões: a regra da transição, que não pode morar só no React,
-- e a prévia de quais células chegam ao piso de três unidades.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Transição de status
-- ---------------------------------------------------------------------

create or replace function valida_transicao_expedicao()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  estados  text[] := array['rascunho','enviado','revisado','validado','publicado'];
  de       int;
  para     int;
  tem_dado boolean;
begin
  if new.status = old.status then
    return new;
  end if;

  de   := array_position(estados, old.status::text);
  para := array_position(estados, new.status::text);

  -- Avança um degrau por vez. Voltar é livre: devolver para correção é
  -- parte do fluxo, e uma expedição publicada por engano precisa poder
  -- sair do mapa sem passar por todas as etapas de novo.
  if para > de + 1 then
    raise exception
      'Transição inválida: % não vai direto para %. O dado passa por cada etapa.',
      old.status, new.status
      using errcode = '23514';
  end if;

  -- Publicar uma expedição vazia não dá erro em lugar nenhum: ela
  -- simplesmente não aparece no mapa, e quem publicou fica procurando o
  -- defeito. Melhor recusar aqui, com o motivo escrito.
  if new.status = 'publicado' then
    select exists (select 1 from unidade_amostral u where u.expedicao_id = new.id)
        or exists (select 1 from observacao_pontual o where o.expedicao_id = new.id)
      into tem_dado;

    if not tem_dado then
      raise exception
        'Expedição sem unidade amostral nem ocorrência não tem o que publicar.'
        using errcode = '23514';
    end if;
  end if;

  if new.status = 'validado' then
    new.validado_por := coalesce(new.validado_por, auth.uid());
    new.validado_em  := coalesce(new.validado_em, now());
  end if;

  -- Devolver desfaz a validação: o carimbo de quem validou não pode
  -- sobreviver ao dado que ele validou.
  if para < de then
    new.validado_por := null;
    new.validado_em  := null;
  end if;

  return new;
end;
$$;

comment on function valida_transicao_expedicao() is
  'Regra de rascunho → enviado → revisado → validado → publicado. Vive no banco porque o botão da tela não é a regra.';

drop trigger if exists trg_expedicao_transicao on expedicao;
create trigger trg_expedicao_transicao
  before update of status on expedicao
  for each row execute function valida_transicao_expedicao();

-- ---------------------------------------------------------------------
-- Prévia da grade
-- ---------------------------------------------------------------------

-- Repete a agregação de pub_observacao_grade para uma expedição só, sem
-- exigir que ela já esteja publicada. Serve para responder, antes de
-- publicar, a única pergunta que importa na revisão: isto vai aparecer
-- no mapa? Uma célula com menos de três unidades amostrais não aparece,
-- e é melhor saber disso agora do que depois.
create or replace function previa_grade_expedicao(p_expedicao_id bigint)
returns table (
  protocolo                text,
  mes                      date,
  unidades_desta_expedicao bigint,
  unidades_na_celula       bigint,
  entra_no_mapa            boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with alvo as (
    select x.id, x.escola_id, date_trunc('month', x.data_campo)::date as mes
    from expedicao x
    where x.id = p_expedicao_id
  ),
  -- Mesma janela da view pública: escola, protocolo e mês. As unidades
  -- já publicadas contam junto, porque no mapa elas se somam às desta.
  base as (
    select u.id,
           u.expedicao_id,
           u.versao_id,
           st_snaptogrid(st_transform(u.geom::geometry, 31983), 100) as vertice,
           a.mes
    from unidade_amostral u
    join expedicao x on x.id = u.expedicao_id
    join alvo a on a.escola_id = x.escola_id
               and a.mes = date_trunc('month', x.data_campo)::date
    where (x.status = 'publicado' or x.id = a.id)
      and u.geom is not null
      and exists (select 1 from observacao_contagem oc where oc.unidade_id = u.id)
  )
  select p.codigo,
         b.mes,
         count(*) filter (where b.expedicao_id = p_expedicao_id),
         count(*),
         count(*) >= 3
  from base b
  join protocolo_versao pv on pv.id = b.versao_id
  join protocolo p on p.id = pv.protocolo_id
  group by b.vertice, p.codigo, b.mes
  having count(*) filter (where b.expedicao_id = p_expedicao_id) > 0;
$$;

comment on function previa_grade_expedicao(bigint) is
  'Quais células desta expedição alcançam o piso de três unidades amostrais e entram no mapa público.';

grant execute on function previa_grade_expedicao(bigint) to authenticated;
