-- =====================================================================
-- Oceano na Escola — entrada só por convite, e o pedido de entrada
--
-- Até aqui havia duas portas: o cadastro próprio (a pessoa criava conta
-- e cadastrava a escola, que esperava aprovação) e o convite. Contas
-- criadas pela primeira porta e abandonadas no meio apareciam na
-- Administração como "Professor", sem escola, sem que ninguém do Ecosurf
-- soubesse quem eram.
--
-- Agora a porta é uma: o convite. Quem quer entrar pede, num formulário
-- público, e o Ecosurf responde convidando — ou recusando.
--
-- O formulário de criar conta continua existindo, mas só na página do
-- convite. Fechar a criação de conta no serviço de autenticação
-- impediria o convidado de criar a dele, e não há chave de service_role
-- para criar contas por fora. Por isso a trava está aqui, no banco: uma
-- conta criada sem convite existe, mas não cadastra escola nem vê dado
-- de escola nenhuma.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Quem pode cadastrar escola
-- ---------------------------------------------------------------------

/*
  Antes: qualquer conta com sessão (`auth.uid() is not null`).
  Agora: quem usou um convite, quem já responde por uma escola (para
  poder cadastrar outra, como já fazia) e o Ecosurf.
*/
create or replace function app_pode_cadastrar_escola()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    app_is_admin()
    or exists (select 1 from vinculo_escola v where v.perfil_id = auth.uid())
    or exists (select 1 from convite c where c.resgatado_por = auth.uid())
  );
$$;

revoke execute on function app_pode_cadastrar_escola() from anon, public;
grant  execute on function app_pode_cadastrar_escola() to authenticated;

drop policy if exists escola_insere on escola;
create policy escola_insere on escola for insert to authenticated
  with check (app_pode_cadastrar_escola());

-- ---------------------------------------------------------------------
-- 2. Pedido de entrada
-- ---------------------------------------------------------------------

do $$ begin
  create type situacao_pedido as enum ('pendente', 'convidado', 'recusado');
exception when duplicate_object then null; end $$;

create table if not exists pedido_entrada (
  id               bigserial primary key,
  nome             text not null check (length(btrim(nome)) between 2 and 120),
  email            text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  -- A organização de quem pede. Nulo é "outra": pesquisa, secretaria,
  -- coletivo — gente que não chega por escola.
  tipo             tipo_organizacao,
  papel_pretendido papel_usuario not null default 'professor'
                   check (papel_pretendido <> 'admin_ecosurf'),
  organizacao      text not null check (length(btrim(organizacao)) between 2 and 160),
  municipio        text check (municipio is null or length(municipio) <= 120),
  funcao           text check (funcao is null or length(funcao) <= 80),
  mensagem         text check (mensagem is null or length(mensagem) <= 1500),
  situacao         situacao_pedido not null default 'pendente',
  criado_em        timestamptz not null default now(),
  analisado_em     timestamptz,
  analisado_por    uuid references perfil(id) on delete set null,
  motivo_recusa    text,
  convite_id       bigint references convite(id) on delete set null
);

comment on table pedido_entrada is
  'Pedido público de entrada na plataforma. Só o Ecosurf lê. Aceitar é convidar.';

-- Um pedido em aberto por e-mail. Quem pede de novo não cria fila dupla.
create unique index if not exists pedido_um_pendente_por_email
  on pedido_entrada (lower(email)) where situacao = 'pendente';

alter table pedido_entrada enable row level security;

drop policy if exists pedido_admin_le on pedido_entrada;
create policy pedido_admin_le on pedido_entrada for select to authenticated
  using (app_is_admin());

-- Nem o anônimo nem o logado escrevem direto: só pela função abaixo, que
-- confere tudo e não diz se o e-mail já tinha pedido.
revoke all on pedido_entrada from anon;
revoke insert, update, delete, truncate, references, trigger on pedido_entrada from authenticated;

/*
  O formulário público chama isto, com a chave anônima.

  Devolve sempre o mesmo silêncio — com pedido novo, com pedido repetido
  — para o formulário não virar um jeito de descobrir quem já pediu.
  E segura enxurrada: passou de 30 pedidos na última hora, recusa, que
  um formulário aberto na internet é exatamente o que robô procura.
*/
create or replace function pedir_entrada(
  p_nome        text,
  p_email       text,
  p_tipo        text,
  p_papel       text,
  p_organizacao text,
  p_municipio   text,
  p_funcao      text,
  p_mensagem    text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_papel papel_usuario;
  v_tipo  tipo_organizacao;
begin
  if (select count(*) from pedido_entrada where criado_em > now() - interval '1 hour') >= 30 then
    raise exception 'Muitos pedidos neste momento. Tente de novo daqui a pouco.' using errcode = '54000';
  end if;

  begin
    v_papel := coalesce(nullif(btrim(p_papel), ''), 'professor')::papel_usuario;
  exception when invalid_text_representation then
    raise exception 'Papel desconhecido.' using errcode = '22023';
  end;
  if v_papel = 'admin_ecosurf' then
    raise exception 'Papel não disponível por pedido.' using errcode = '22023';
  end if;

  v_tipo := case lower(btrim(coalesce(p_tipo, '')))
              when 'regular' then 'regular'::tipo_organizacao
              when 'surf'    then 'surf'::tipo_organizacao
              else null end;

  -- Já há pedido em aberto para este e-mail: não duplica, e não diz.
  if exists (select 1 from pedido_entrada where lower(email) = v_email and situacao = 'pendente') then
    return;
  end if;

  insert into pedido_entrada (nome, email, tipo, papel_pretendido, organizacao, municipio, funcao, mensagem)
  values (
    btrim(p_nome),
    v_email,
    v_tipo,
    v_papel,
    btrim(p_organizacao),
    nullif(btrim(coalesce(p_municipio, '')), ''),
    nullif(btrim(coalesce(p_funcao, '')), ''),
    nullif(btrim(coalesce(p_mensagem, '')), '')
  );
end;
$$;

revoke execute on function pedir_entrada(text, text, text, text, text, text, text, text) from public;
grant  execute on function pedir_entrada(text, text, text, text, text, text, text, text) to anon, authenticated;

/*
  Marca o pedido como respondido com convite. O convite em si é criado
  pela rota de convite, que manda o e-mail; aqui só se liga um ao outro,
  pelo e-mail, ao convite em aberto mais recente.
*/
create or replace function admin_marca_pedido_convidado(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_convite bigint;
begin
  if not app_is_admin() then
    raise exception 'Só o Instituto Ecosurf responde pedidos de entrada.' using errcode = '42501';
  end if;
  select lower(email) into v_email from pedido_entrada where id = p_id;
  if not found then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;
  select id into v_convite from convite
   where email = v_email and resgatado_em is null and revogado_em is null
   order by criado_em desc limit 1;
  if v_convite is null then
    raise exception 'Não há convite em aberto para este e-mail. Crie o convite antes.' using errcode = '23514';
  end if;
  update pedido_entrada
     set situacao = 'convidado', convite_id = v_convite,
         analisado_em = now(), analisado_por = auth.uid(), motivo_recusa = null
   where id = p_id;
end;
$$;

create or replace function admin_recusa_pedido(p_id bigint, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_is_admin() then
    raise exception 'Só o Instituto Ecosurf responde pedidos de entrada.' using errcode = '42501';
  end if;
  update pedido_entrada
     set situacao = 'recusado', analisado_em = now(), analisado_por = auth.uid(),
         motivo_recusa = nullif(btrim(coalesce(p_motivo, '')), '')
   where id = p_id;
  if not found then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function admin_marca_pedido_convidado(bigint) from anon, public;
revoke execute on function admin_recusa_pedido(bigint, text) from anon, public;
grant  execute on function admin_marca_pedido_convidado(bigint) to authenticated;
grant  execute on function admin_recusa_pedido(bigint, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3. As contas, vistas pelo Ecosurf
-- ---------------------------------------------------------------------

/*
  O que a Administração precisa saber de cada conta e que mora em
  auth.users, fora do alcance do navegador: quando foi criada, quando
  entrou pela última vez, se confirmou o e-mail, e se veio por convite.
  É o que separa "professor da rede" de "alguém criou conta e sumiu".
*/
create or replace function admin_contas()
returns table (
  id               uuid,
  email            text,
  criada_em        timestamptz,
  ultimo_acesso    timestamptz,
  email_confirmado boolean,
  veio_por_convite boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not app_is_admin() then
    raise exception 'Só o Instituto Ecosurf vê as contas da rede.' using errcode = '42501';
  end if;
  return query
    select u.id,
           u.email::text,
           u.created_at,
           u.last_sign_in_at,
           u.email_confirmed_at is not null,
           exists (select 1 from convite c where c.resgatado_por = u.id)
      from auth.users u
      join perfil p on p.id = u.id;
end;
$$;

revoke execute on function admin_contas() from anon, public;
grant  execute on function admin_contas() to authenticated;

/*
  Remove uma conta de vez.

  Só se ela não tiver trabalho registrado. Expedição, foto, texto e
  curadoria guardam quem fez — apagar a pessoa apagaria a autoria, ou
  derrubaria o dado junto. Para tirar o acesso de quem trabalhou, o
  caminho é remover o vínculo com a escola; o trabalho fica.

  O convite usado por ela perde só a referência à conta: a linha fica,
  com o e-mail e a data, como registro de que o convite foi aceito.
*/
create or replace function admin_remove_conta(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_papel papel_usuario;
begin
  if not app_is_admin() then
    raise exception 'Só o Instituto Ecosurf remove contas.' using errcode = '42501';
  end if;
  if p_id = auth.uid() then
    raise exception 'Você não pode remover a sua própria conta por aqui.' using errcode = '42501';
  end if;
  select papel into v_papel from public.perfil where id = p_id;
  if v_papel = 'admin_ecosurf' then
    raise exception 'Conta de administração não se remove por aqui. Troque o papel antes.' using errcode = '42501';
  end if;

  update public.convite set resgatado_por = null where resgatado_por = p_id;

  begin
    delete from auth.users where id = p_id;
  exception when foreign_key_violation then
    raise exception 'Esta conta tem trabalho registrado na plataforma (expedições, fotos, textos ou curadoria). Para tirar o acesso sem apagar esse trabalho, remova o vínculo dela com a escola.'
      using errcode = '23503';
  end;
end;
$$;

revoke execute on function admin_remove_conta(uuid) from anon, public;
grant  execute on function admin_remove_conta(uuid) to authenticated;
