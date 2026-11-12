/*
  Super administração: editar e excluir qualquer conteúdo da rede.

  A administração do Ecosurf (`admin_ecosurf`) já edita tudo pela regra
  de vínculo — `app_tem_vinculo` devolve verdadeiro para ela em qualquer
  escola. O que faltava era EXCLUIR o que não se exclui por vínculo: a
  escola inteira e a pessoa que tem trabalho registrado. Esse poder é
  maior do que o de administrar, e por isso não vai para todo
  administrador: vai para quem tem `perfil.super_admin`.

  Quem é super administrador não se escolhe pela plataforma. A coluna não
  tem grant de escrita e nenhuma função a altera: o primeiro é marcado
  direto no banco, pelo dono do projeto, e qualquer outro também. Assim
  uma conta administradora comprometida não se promove a super nem
  promove ninguém.

  Super administrador é sempre também administrador (check abaixo): o
  papel dele não pode ser rebaixado por outro administrador, e a conta
  não pode ser removida por `admin_remove_conta`, que já recusa conta de
  administração.
*/

alter table perfil add column if not exists super_admin boolean not null default false;

alter table perfil drop constraint if exists super_admin_e_administracao;
alter table perfil add constraint super_admin_e_administracao
  check (not super_admin or papel = 'admin_ecosurf');

comment on column perfil.super_admin is
  'Pode excluir escola inteira e conta com trabalho registrado. Marcado só direto no banco.';

create or replace function app_is_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select super_admin from perfil where id = auth.uid()), false);
$$;

revoke execute on function app_is_super() from anon, public;
grant  execute on function app_is_super() to authenticated;

-- O papel do super administrador não se rebaixa pela tela de pessoas.
create or replace function admin_define_papel(p_perfil_id uuid, p_papel papel_usuario)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_is_admin() then
    raise exception 'Só a administração do Ecosurf altera papel de usuário.'
      using errcode = '42501';
  end if;

  if p_papel <> 'admin_ecosurf' and (select super_admin from perfil where id = p_perfil_id) then
    raise exception 'Esta conta é de super administração: o papel dela não se altera pela plataforma.'
      using errcode = '42501';
  end if;

  -- O último admin não se rebaixa sozinho: uma rede sem administrador
  -- não tem como voltar a ter um pela interface.
  if p_papel <> 'admin_ecosurf'
     and (select papel from perfil where id = p_perfil_id) = 'admin_ecosurf'
     and (select count(*) from perfil where papel = 'admin_ecosurf') <= 1 then
    raise exception 'Este é o único administrador da rede. Promova outro antes de rebaixar este.'
      using errcode = '23514';
  end if;

  update perfil set papel = p_papel where id = p_perfil_id;
end;
$$;

/*
  Os arquivos de uma escola no Storage: fotos de toda espécie (campo,
  turma, capa, mural) e fotos da coordenação. A tela pede a lista ANTES
  de excluir a escola — depois, as linhas que apontam para os arquivos
  já não existem — e apaga os arquivos depois que o banco confirmou.
*/
create or replace function super_arquivos_da_escola(p_escola_id bigint)
returns setof text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not app_is_super() then
    raise exception 'Só a super administração exclui escola.' using errcode = '42501';
  end if;
  return query
    select storage_path from evidencia where escola_id = p_escola_id and storage_path is not null
    union
    select foto_path from escola_coordenador where escola_id = p_escola_id and foto_path is not null;
end;
$$;

/*
  Exclui a escola e tudo o que é dela: turmas, saídas, ocorrências,
  contagens, fotos, mural, histórias, coordenação, vínculos e convites —
  pelas chaves em cascata que já existem.

  Pede o nome da escola digitado de novo. Não é segurança (quem chega
  aqui já é super administrador); é para a exclusão não acontecer por
  um clique na linha errada.
*/
create or replace function super_exclui_escola(p_escola_id bigint, p_nome_confirmado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
begin
  if not app_is_super() then
    raise exception 'Só a super administração exclui escola.' using errcode = '42501';
  end if;
  select nome into v_nome from escola where id = p_escola_id;
  if v_nome is null then
    raise exception 'Escola não encontrada.' using errcode = 'P0002';
  end if;
  if btrim(coalesce(p_nome_confirmado, '')) <> btrim(v_nome) then
    raise exception 'O nome digitado não confere com o da escola.' using errcode = '22023';
  end if;
  delete from escola where id = p_escola_id;
end;
$$;

/*
  Remove uma conta mesmo com trabalho registrado.

  O trabalho fica; a autoria vira vazia ("conta removida"). Toda coluna
  que aponta para perfil sem cascata é anulada antes — procurada no
  catálogo do banco, e não numa lista escrita à mão, para que uma tabela
  nova com autoria não volte a travar a remoção sem ninguém perceber.

  Não remove a própria conta nem a de outro super administrador.
*/
create or replace function super_remove_conta(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  r record;
begin
  if not app_is_super() then
    raise exception 'Só a super administração remove conta com trabalho registrado.' using errcode = '42501';
  end if;
  if p_id = auth.uid() then
    raise exception 'Você não pode remover a sua própria conta por aqui.' using errcode = '42501';
  end if;
  if (select super_admin from public.perfil where id = p_id) then
    raise exception 'Conta de super administração não se remove pela plataforma.' using errcode = '42501';
  end if;

  for r in
    select c.conrelid::regclass as tabela, a.attname as coluna
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f'
       and c.confrelid = 'public.perfil'::regclass
       and c.confdeltype in ('a', 'r')
       and array_length(c.conkey, 1) = 1
  loop
    execute format('update %s set %I = null where %I = $1', r.tabela, r.coluna, r.coluna) using p_id;
  end loop;

  delete from auth.users where id = p_id;
end;
$$;

revoke execute on function super_arquivos_da_escola(bigint) from anon, public;
revoke execute on function super_exclui_escola(bigint, text) from anon, public;
revoke execute on function super_remove_conta(uuid) from anon, public;
grant  execute on function super_arquivos_da_escola(bigint) to authenticated;
grant  execute on function super_exclui_escola(bigint, text) to authenticated;
grant  execute on function super_remove_conta(uuid) to authenticated;
