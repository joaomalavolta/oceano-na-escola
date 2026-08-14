-- =====================================================================
-- Oceano na Escola — análise do cadastro de escola
--
-- Defeito que esta migration conserta, antes de qualquer coisa nova:
-- `publicada` estava concedida em update ao papel `authenticated`. A
-- migration 20260812020000 a incluiu na lista de colunas editáveis, e a
-- tela de edição da escola expõe o botão correspondente a quem tem
-- vínculo. Como qualquer pessoa cria conta sozinha, cadastra escola
-- (a policy de insert pede só sessão) e é vinculada a ela pelo gatilho,
-- o caminho inteiro do cadastro anônimo até o mapa público estava
-- aberto. Nenhuma etapa passava pelo Ecosurf.
--
-- A correção não é só revogar a coluna. Revogar sozinho deixaria a
-- escola sem meio nenhum de sair do limbo, e o Ecosurf sem saber que
-- ela chegou: hoje o painel lista escola nova junto com escola que está
-- fora do ar de propósito, sem nada que as distinga. Então o cadastro
-- passa a ter situação declarada, e o painel passa a ter fila.
--
-- A situação e a publicação são coisas diferentes, e é de propósito:
--
--   situacao  — o parecer do Ecosurf sobre o cadastro. Muda pouco.
--   publicada — a escola está no mapa agora. A própria escola mexe,
--               desde que já tenha sido aprovada.
--
-- Uma coluna só faria a escola aprovada que tirasse a página do ar
-- voltar para a fila de análise a cada vez, como se fosse cadastro
-- novo.
-- =====================================================================

create type situacao_escola as enum ('pendente', 'aprovada', 'recusada');

alter table escola
  add column if not exists situacao      situacao_escola not null default 'pendente',
  add column if not exists analisada_em  timestamptz,
  add column if not exists analisada_por uuid references perfil(id),
  add column if not exists motivo_recusa text;

comment on column escola.situacao is
  'Parecer do Ecosurf sobre o cadastro. Nasce pendente e só muda por função com definer.';
comment on column escola.motivo_recusa is
  'O que a escola precisa corrigir. Exibido a quem tem vínculo, nunca em página pública.';

-- As escolas que já existem são anteriores à fila. Marcá-las como
-- pendentes tiraria do mapa quatro escolas que já estão publicadas e
-- encheria a fila de trabalho que ninguém precisa fazer.
update escola set situacao = 'aprovada', analisada_em = criado_em where situacao = 'pendente';

-- ---------------------------------------------------------------------
-- O portão
-- ---------------------------------------------------------------------

revoke update (publicada) on escola from authenticated;

comment on column escola.publicada is
  'A escola aparece no mapa da rede. Não é concedida ao cliente: passa por escola_define_visibilidade(), que exige cadastro já aprovado.';

-- ---------------------------------------------------------------------
-- O parecer do Ecosurf
-- ---------------------------------------------------------------------

create or replace function admin_aprova_escola(p_escola_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_geom geography;
begin
  if not app_is_admin() then
    raise exception 'Só a administração do Ecosurf aprova cadastro de escola.'
      using errcode = '42501';
  end if;

  select geom into v_geom from escola where id = p_escola_id;
  if not found then
    raise exception 'Escola não encontrada.' using errcode = 'P0002';
  end if;

  -- Aprovar sem coordenada aprovaria para lugar nenhum: a view do mapa
  -- exige a geometria, e a escola sumiria do mapa logo depois de o
  -- painel dizer que ela entrou.
  if v_geom is null then
    raise exception 'Esta escola ainda não tem coordenada. Sem posição ela não aparece no mapa, mesmo aprovada.'
      using errcode = '23514';
  end if;

  update escola
     set situacao      = 'aprovada',
         publicada     = true,
         motivo_recusa = null,
         analisada_em  = now(),
         analisada_por = auth.uid()
   where id = p_escola_id;
end;
$$;

create or replace function admin_recusa_escola(p_escola_id bigint, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_is_admin() then
    raise exception 'Só a administração do Ecosurf recusa cadastro de escola.'
      using errcode = '42501';
  end if;

  -- Recusa sem motivo é recusa que a escola não tem como responder, e
  -- ela volta como o mesmo cadastro na semana seguinte.
  if coalesce(btrim(p_motivo), '') = '' then
    raise exception 'Escreva o motivo da recusa: é o que a escola vê para poder corrigir.'
      using errcode = '23514';
  end if;

  update escola
     set situacao      = 'recusada',
         publicada     = false,
         motivo_recusa = btrim(p_motivo),
         analisada_em  = now(),
         analisada_por = auth.uid()
   where id = p_escola_id;

  if not found then
    raise exception 'Escola não encontrada.' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- O que a escola faz do lado dela
-- ---------------------------------------------------------------------

create or replace function escola_pede_analise(p_escola_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_situacao situacao_escola;
begin
  if not app_tem_vinculo(p_escola_id) then
    raise exception 'Só quem responde pela escola pede a análise dela.'
      using errcode = '42501';
  end if;

  select situacao into v_situacao from escola where id = p_escola_id;
  if not found then
    raise exception 'Escola não encontrada.' using errcode = 'P0002';
  end if;

  -- Só de recusada para pendente. Escola aprovada que se reenviasse
  -- sairia do mapa por engano, e escola pendente que se reenviasse
  -- pularia a fila para o fim dela.
  if v_situacao <> 'recusada' then
    raise exception 'Este cadastro não está recusado — não há o que reenviar.'
      using errcode = '23514';
  end if;

  update escola
     set situacao      = 'pendente',
         analisada_em  = null,
         analisada_por = null
   where id = p_escola_id;
end;
$$;

create or replace function escola_define_visibilidade(p_escola_id bigint, p_publicada boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_situacao situacao_escola;
begin
  if not app_tem_vinculo(p_escola_id) then
    raise exception 'Só quem responde pela escola muda a visibilidade dela.'
      using errcode = '42501';
  end if;

  select situacao into v_situacao from escola where id = p_escola_id;
  if not found then
    raise exception 'Escola não encontrada.' using errcode = 'P0002';
  end if;

  -- Tirar do ar é sempre permitido: a escola desiste de expor a página
  -- quando quiser, sem pedir licença. Botar no ar exige a aprovação —
  -- é aqui que o portão fecha.
  if p_publicada and v_situacao <> 'aprovada' then
    raise exception 'O cadastro desta escola ainda não foi aprovado pelo Instituto Ecosurf.'
      using errcode = '42501';
  end if;

  update escola set publicada = p_publicada where id = p_escola_id;
end;
$$;

comment on function admin_aprova_escola(bigint) is
  'Aprova o cadastro e põe a escola no mapa. Definer porque publicada não é concedida ao cliente.';
comment on function admin_recusa_escola(bigint, text) is
  'Recusa o cadastro com motivo, que a escola lê para corrigir e reenviar.';
comment on function escola_pede_analise(bigint) is
  'Devolve à fila um cadastro recusado, depois de a escola corrigir o que foi apontado.';
comment on function escola_define_visibilidade(bigint, boolean) is
  'A escola tira a própria página do ar e a devolve. Só devolve se o cadastro estiver aprovado.';

grant execute on function admin_aprova_escola(bigint)                to authenticated;
grant execute on function admin_recusa_escola(bigint, text)          to authenticated;
grant execute on function escola_pede_analise(bigint)                to authenticated;
grant execute on function escola_define_visibilidade(bigint, boolean) to authenticated;

-- Definer roda como dono e ignora RLS: o anônimo não executa nenhuma
-- delas. `revoke from public` não alcança isto — o Supabase concede a
-- anon por padrão, e é preciso dizer o nome do papel.
revoke execute on function admin_aprova_escola(bigint)                from anon, public;
revoke execute on function admin_recusa_escola(bigint, text)          from anon, public;
revoke execute on function escola_pede_analise(bigint)                from anon, public;
revoke execute on function escola_define_visibilidade(bigint, boolean) from anon, public;
