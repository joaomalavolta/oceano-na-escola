-- =====================================================================
-- Oceano na Escola — pedido de remoção despublica na hora
--
-- As premissas são explícitas: "a imagem passa ao estado despublicada
-- ANTES da exclusão definitiva". O prazo de 72 horas do termo de
-- parceria é para apagar o arquivo, não para deixar de exibi-lo — quem
-- pediu não deve esperar o atendimento para a foto sair do ar.
--
-- Isso não pode morar no cliente: quem faz o pedido é anônimo, e o
-- anônimo não tem — nem deve ter — update em evidencia. Vive aqui.
-- =====================================================================

create or replace function despublica_ao_pedir_remocao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update evidencia
     set status = 'despublicada',
         publicada_em = null
   where id = new.evidencia_id
     and status = 'publicada';
  return new;
end;
$$;

comment on function despublica_ao_pedir_remocao() is
  'Pedido formalizado tira a imagem do ar imediatamente. A exclusão definitiva vem no atendimento, em até 72 horas.';

drop trigger if exists trg_remocao_despublica on solicitacao_remocao;
create trigger trg_remocao_despublica
  after insert on solicitacao_remocao
  for each row execute function despublica_ao_pedir_remocao();

-- ---------------------------------------------------------------------
-- Quem atende
-- ---------------------------------------------------------------------

-- A policy original deixava só o Ecosurf fechar o pedido. A escola que
-- publicou a imagem é quem consegue agir mais rápido, e a família que
-- pediu é atendida pela primeira das duas — o termo diz "em até 72
-- horas", não "por uma pessoa específica". Espelha remocao_leitura.
drop policy if exists remocao_admin on solicitacao_remocao;
create policy remocao_atendimento on solicitacao_remocao for update to authenticated
  using (app_is_admin()
         or exists (select 1 from evidencia ev where ev.id = evidencia_id
                    and app_tem_vinculo(ev.escola_id)))
  with check (app_is_admin()
              or exists (select 1 from evidencia ev where ev.id = evidencia_id
                         and app_tem_vinculo(ev.escola_id)));
