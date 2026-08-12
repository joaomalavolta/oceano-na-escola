-- =====================================================================
-- Oceano na Escola — administração da rede
--
-- Três coisas que faltavam para a escola ser editável e para o Ecosurf
-- administrar a rede sem abrir o SQL Editor.
--
-- 1. Duas colunas de escola estavam atualizáveis pelo cliente e não
--    deveriam: `criado_por`, que é registro de autoria e não pode ser
--    reescrito por quem chegou depois, e `slug`, que é o endereço
--    público da escola — trocá-lo quebra todo link já compartilhado.
--
-- 2. O papel do perfil não tinha como ser alterado por ninguém. O grant
--    de update em `perfil` cobre só `nome`, de propósito: com `papel`
--    concedido, qualquer professor se promoveria a admin_ecosurf, já
--    que a policy deixa a pessoa editar o próprio perfil. A saída é uma
--    função com definer que confere app_is_admin() por dentro.
--
-- 3. O admin precisa enxergar a rede inteira para administrá-la, e as
--    policies de perfil e vínculo já preveem isso — faltava a função de
--    escrita.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. O que o cliente não reescreve
-- ---------------------------------------------------------------------

revoke update on escola from authenticated;
grant  update (municipio_id, nome, rede_ensino, endereco, geom, apresentacao,
               publicada, termos_ok)
  on escola to authenticated;

comment on column escola.slug is
  'Endereço público da escola. Não é atualizável pelo cliente: trocar o slug quebra todo link já compartilhado. Mudança de slug é operação do Ecosurf, com redirecionamento planejado.';

-- ---------------------------------------------------------------------
-- 2. Papel do perfil
-- ---------------------------------------------------------------------

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

comment on function admin_define_papel(uuid, papel_usuario) is
  'Altera o papel de um perfil. Definer porque conceder update na coluna papel deixaria qualquer pessoa se promover.';

grant execute on function admin_define_papel(uuid, papel_usuario) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Quem administra quais escolas
-- ---------------------------------------------------------------------

-- A leitura de vínculo mostrava só o próprio. Para o admin montar a
-- tela de administração — quem responde por qual escola — ele precisa
-- ver todos, e a policy já dizia isso; o que faltava era enxergar o
-- nome de quem está do outro lado, que vem de perfil e já é liberado
-- ao admin pela policy perfil_proprio.

-- Coordenação municipal acompanha várias escolas, e é por vínculo que
-- isso acontece. Só o Ecosurf cria e desfaz vínculo — quem tem vínculo
-- não amplia o próprio alcance.
comment on table vinculo_escola is
  'Quem responde por qual escola. Criado por gatilho ao cadastrar, ou pela administração do Ecosurf. Ninguém se vincula sozinho.';
