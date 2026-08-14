-- =====================================================================
-- Oceano na Escola — convite da plataforma
--
-- Segunda porta de entrada, ao lado do cadastro espontâneo. Ali a
-- pessoa chega e o Ecosurf decide depois; aqui o Ecosurf decide antes e
-- vai buscar quem quer.
--
-- Quem entra por convite NÃO passa pela fila de análise: seria pedir
-- duas vezes a mesma permissão. O convite é a aprovação, dada de
-- antemão — e por isso ele carrega o papel e, quando faz sentido, o
-- vínculo com uma escola que já existe. É assim que se convida uma
-- pesquisadora, que não tem escola nenhuma, ou uma coordenadora
-- municipal, que tem várias.
--
-- O convite é preso ao e-mail de quem foi convidado. Link repassado no
-- grupo da escola não vira acesso para quem pegou: o resgate confere o
-- e-mail da sessão contra o do convite. Sem isso, "controle de acesso"
-- seria só uma palavra.
-- =====================================================================

create table convite (
  id            bigserial primary key,
  -- Guardado normalizado, e comparado normalizado no resgate: e-mail
  -- não distingue maiúscula, e "Maria@" e "maria@" são a mesma pessoa.
  email         text not null,
  papel         papel_usuario not null default 'professor',
  -- Opcional: convite de pesquisador não tem escola, e convite de
  -- professor para escola que ainda não existe também não.
  escola_id     bigint references escola(id) on delete cascade,
  token         text not null unique,
  mensagem      text,

  criado_por    uuid references perfil(id) default auth.uid(),
  criado_em     timestamptz not null default now(),
  expira_em     timestamptz not null default now() + interval '14 days',

  resgatado_em  timestamptz,
  resgatado_por uuid references perfil(id),
  revogado_em   timestamptz,

  constraint convite_email_normalizado check (email = lower(btrim(email))),
  constraint convite_email_parece_email check (email like '%_@_%.__%')
);

comment on table convite is
  'Convites para entrar na plataforma. Quem entra por aqui não passa pela fila de análise: o convite é a aprovação dada antes.';
comment on column convite.token is
  'Segredo do link. 32 hexadecimais de gen_random_uuid, e o resgate ainda exige que o e-mail da sessão seja o do convite.';
comment on column convite.escola_id is
  'Escola a que o convidado fica vinculado ao aceitar. Nulo para quem não responde por escola nenhuma — pesquisador, por exemplo.';

-- Um convite aberto por e-mail. Convidar de novo depois de expirar ou
-- de revogar é normal e precisa passar; convidar duas vezes ao mesmo
-- tempo gera dois links válidos para a mesma pessoa, e aí um deles fica
-- perdido em alguma caixa de entrada.
create unique index convite_um_aberto_por_email
  on convite (email)
  where resgatado_em is null and revogado_em is null;

create index convite_por_escola on convite (escola_id) where escola_id is not null;

alter table convite enable row level security;

-- Só a administração enxerga a tabela. O convidado não lê a linha dele:
-- ele chega pelo token, e quem responde pelo token é uma função com
-- definer, que devolve só o que cabe mostrar antes de a pessoa entrar.
create policy convite_admin on convite for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

grant select on convite to authenticated;

-- ---------------------------------------------------------------------
-- Criar e revogar — só o Ecosurf
-- ---------------------------------------------------------------------

create or replace function admin_cria_convite(
  p_email     text,
  p_papel     papel_usuario default 'professor',
  p_escola_id bigint default null,
  p_mensagem  text default null,
  p_dias      int default 14
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(p_email));
  v_token text := replace(gen_random_uuid()::text, '-', '');
begin
  if not app_is_admin() then
    raise exception 'Só a administração do Ecosurf convida para a plataforma.'
      using errcode = '42501';
  end if;

  if v_email not like '%_@_%.__%' then
    raise exception 'E-mail inválido: %', p_email using errcode = '23514';
  end if;

  if p_dias < 1 or p_dias > 90 then
    raise exception 'A validade do convite vai de 1 a 90 dias.' using errcode = '23514';
  end if;

  -- Convidar quem já entrou não é necessariamente erro de digitação,
  -- mas o convite não faria nada: o papel e o vínculo dessa pessoa se
  -- ajustam na própria tela de administração.
  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    raise exception 'Já existe conta com este e-mail. Ajuste o papel e o vínculo dela na lista de pessoas.'
      using errcode = '23514';
  end if;

  -- Conferido aqui, e não no handler de unique_violation: o índice
  -- parcial continua sendo a garantia, mas capturar a violação apagaria
  -- a mensagem dos raise acima, que também são erros de unicidade e
  -- cairiam no mesmo handler com o texto errado.
  if exists (
    select 1 from convite
     where email = v_email and resgatado_em is null and revogado_em is null
  ) then
    raise exception 'Já existe convite aberto para %. Revogue o anterior antes de criar outro.', v_email
      using errcode = '23514';
  end if;

  insert into convite (email, papel, escola_id, token, mensagem, expira_em)
  values (v_email, p_papel, p_escola_id, v_token, nullif(btrim(p_mensagem), ''),
          now() + make_interval(days => p_dias));

  return v_token;
end;
$$;

create or replace function admin_revoga_convite(p_convite_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_is_admin() then
    raise exception 'Só a administração do Ecosurf revoga convite.'
      using errcode = '42501';
  end if;

  update convite
     set revogado_em = now()
   where id = p_convite_id
     and resgatado_em is null
     and revogado_em is null;

  if not found then
    raise exception 'Convite não encontrado, ou já resgatado, ou já revogado.'
      using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- O que o convidado vê antes de entrar
-- ---------------------------------------------------------------------

/*
  Devolve o convite pelo token, para a página do convite se apresentar.

  O e-mail sai mascarado. Quem tem o link deveria ser quem o recebeu,
  mas link vaza — vai parar em print de grupo, em histórico de
  navegador emprestado —, e um link vazado não precisa entregar de
  brinde o endereço de alguém. A máscara é o bastante para a pessoa
  reconhecer o próprio e-mail e não o bastante para um estranho anotar
  o de outro.
*/
create or replace function convite_do_token(p_token text)
returns table (
  email_mascarado text,
  papel           papel_usuario,
  escola_nome     text,
  mensagem        text,
  expira_em       timestamptz,
  situacao        text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    regexp_replace(split_part(c.email, '@', 1), '^(.).*$', '\1') || '***@' ||
      split_part(c.email, '@', 2)                            as email_mascarado,
    c.papel,
    e.nome                                                   as escola_nome,
    c.mensagem,
    c.expira_em,
    case
      when c.revogado_em  is not null then 'revogado'
      when c.resgatado_em is not null then 'resgatado'
      when c.expira_em    <  now()    then 'expirado'
      else 'aberto'
    end                                                      as situacao
  from convite c
  left join escola e on e.id = c.escola_id
  where c.token = p_token;
$$;

comment on function convite_do_token(text) is
  'O convite pelo token, com o e-mail mascarado. Aberto ao anônimo de propósito: a página do convite existe antes de a pessoa ter conta.';

-- ---------------------------------------------------------------------
-- O resgate
-- ---------------------------------------------------------------------

create or replace function resgatar_convite(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c            convite%rowtype;
  v_email_jwt  text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if auth.uid() is null then
    raise exception 'Entre na plataforma para aceitar o convite.' using errcode = '42501';
  end if;

  select * into c from convite where token = p_token;
  if not found then
    raise exception 'Convite não encontrado. Confira o link.' using errcode = 'P0002';
  end if;

  if c.revogado_em is not null then
    raise exception 'Este convite foi cancelado pelo Instituto Ecosurf.' using errcode = '42501';
  end if;
  if c.resgatado_em is not null then
    raise exception 'Este convite já foi usado.' using errcode = '42501';
  end if;
  if c.expira_em < now() then
    raise exception 'Este convite expirou. Peça um novo ao Instituto Ecosurf.' using errcode = '42501';
  end if;

  -- O portão. Sem isto, qualquer pessoa com o link entraria com o papel
  -- que era de outra — e o link circula por WhatsApp de escola.
  if v_email_jwt = '' or v_email_jwt <> c.email then
    raise exception 'Este convite foi feito para outro e-mail. Entre com o endereço que recebeu o convite.'
      using errcode = '42501';
  end if;

  -- O perfil pode ainda não existir: quem acabou de criar conta chega
  -- aqui antes de a interface ter gravado a linha. Cria com o nome que
  -- o provedor deu, e o resto da plataforma segue igual.
  insert into perfil (id, nome)
  values (
    auth.uid(),
    coalesce(
      nullif(btrim(auth.jwt() -> 'user_metadata' ->> 'nome'), ''),
      nullif(btrim(auth.jwt() -> 'user_metadata' ->> 'full_name'), ''),
      split_part(c.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  -- O papel vem do convite, e é este o ponto de toda a construção: o
  -- Ecosurf decide o que a pessoa é antes de ela chegar, em vez de
  -- corrigir depois.
  update perfil set papel = c.papel where id = auth.uid();

  if c.escola_id is not null then
    insert into vinculo_escola (perfil_id, escola_id)
    values (auth.uid(), c.escola_id)
    on conflict do nothing;
  end if;

  update convite
     set resgatado_em = now(), resgatado_por = auth.uid()
   where id = c.id;

  -- Para onde a tela manda a pessoa em seguida. Com escola, ela já tem
  -- onde trabalhar; sem escola e sendo professora, falta cadastrar a
  -- dela; pesquisador nenhum precisa de escola.
  return case
    when c.escola_id is not null then 'painel'
    when c.papel = 'professor'   then 'onboarding'
    else 'painel'
  end;
end;
$$;

comment on function resgatar_convite(text) is
  'Aceita o convite: aplica papel e vínculo a quem está na sessão. Exige que o e-mail da sessão seja o do convite.';

grant execute on function admin_cria_convite(text, papel_usuario, bigint, text, int) to authenticated;
grant execute on function admin_revoga_convite(bigint)                               to authenticated;
grant execute on function resgatar_convite(text)                                     to authenticated;
-- Esta é a única aberta ao anônimo, e de propósito: a página do convite
-- precisa se apresentar antes de a pessoa ter conta.
grant execute on function convite_do_token(text) to anon, authenticated;

revoke execute on function admin_cria_convite(text, papel_usuario, bigint, text, int) from anon, public;
revoke execute on function admin_revoga_convite(bigint)                               from anon, public;
revoke execute on function resgatar_convite(text)                                     from anon, public;
