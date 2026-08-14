-- ---------------------------------------------------------------------
-- Quais escolas o usuário pode de fato usar
-- ---------------------------------------------------------------------
--
-- As políticas dão leitura mais larga que escrita, de propósito: o
-- pesquisador lê a rede inteira e não escreve em lugar nenhum, e quem
-- cadastrou uma escola continua enxergando o que cadastrou. Ler
-- `escola` e oferecer o resultado como opção num formulário de criação
-- confunde as duas coisas — o seletor de "nova saída de campo" listava
-- escola que o professor não consegue usar, ele escolhia, e o insert
-- voltava com erro cru de política.
--
-- Esta função responde à pergunta que o formulário precisa fazer: onde
-- eu posso escrever. Ela chama `app_tem_vinculo`, a mesma função do
-- `with check` das políticas de escrita, então as duas não têm como
-- divergir com o tempo.
--
-- É SECURITY DEFINER, mas devolve estritamente menos que a política de
-- leitura já permite: só as escolas com vínculo. Não abre nada.

create or replace function app_escolas_que_posso_usar()
returns table (id bigint, nome text, slug text, municipio_id bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.nome, e.slug, e.municipio_id
    from escola e
   where app_tem_vinculo(e.id)
   order by e.nome;
$$;

-- `revoke from public` não alcança a concessão que o Supabase dá a
-- `anon` por privilégio padrão neste schema — daí o revoke nominal.
-- Hoje a função devolveria zero linhas para o anônimo, porque
-- `app_tem_vinculo` depende de `auth.uid()`, mas ela é SECURITY DEFINER
-- e lê `escola` por fora do RLS: não é lugar para quem não fez login.
-- Quem responde ao anônimo são as views `pub_*`.
revoke all on function app_escolas_que_posso_usar() from public;
revoke execute on function app_escolas_que_posso_usar() from anon;
grant execute on function app_escolas_que_posso_usar() to authenticated;

comment on function app_escolas_que_posso_usar() is
  'Escolas em que o usuário atual pode criar expedição e registrar dado. '
  'Use em formulários de criação; `escola` direto serve para leitura.';
