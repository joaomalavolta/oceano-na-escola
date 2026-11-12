/*
  Saída vazia não avança, e a saída guarda quem a abriu.

  1. O que conta como dado.

     A transição conferia só se existia unidade amostral. Mas salvar a
     ficha cria uma unidade por equipe, preenchida ou não: uma saída
     aberta e enviada em seguida, sem ninguém ter ido a campo, passava
     na conferência — e podia ser publicada vazia.

     Dado é: uma ocorrência registrada, uma contagem na ficha, ou um
     esforço medido (área amostrada). Este último cobre o caso legítimo
     de a turma percorrer o trecho e não encontrar nada: zero medido é
     dado; ficha em branco não é.

  2. A trava vale ao avançar para "enviado" e para "publicado".

     Enviar para revisão é o gesto de "terminei a saída". Feito numa
     saída sem nada, ele tira a saída do registro de campo — que só
     aceita rascunho — e a escola fica sem onde registrar. Voltar
     continua livre: a saída validada vazia precisa poder voltar a
     rascunho.

  3. criado_por passa a ser preenchido pelo banco, com a sessão de quem
     abre. O cliente nunca o enviava, e todas as saídas estavam sem
     autor.
*/

create or replace function expedicao_tem_dado(p_expedicao_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from observacao_pontual o where o.expedicao_id = p_expedicao_id)
      or exists (select 1
                   from observacao_contagem c
                   join unidade_amostral u on u.id = c.unidade_id
                  where u.expedicao_id = p_expedicao_id)
      or exists (select 1 from unidade_amostral u
                  where u.expedicao_id = p_expedicao_id and coalesce(u.area_m2, 0) > 0);
$$;

revoke execute on function expedicao_tem_dado(bigint) from anon, public;
grant  execute on function expedicao_tem_dado(bigint) to authenticated;

create or replace function valida_transicao_expedicao()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  estados text[] := array['rascunho','enviado','revisado','validado','publicado'];
  de      int;
  para    int;
begin
  if new.status = old.status then
    return new;
  end if;

  de   := array_position(estados, old.status::text);
  para := array_position(estados, new.status::text);

  if para > de + 1 then
    raise exception
      'Transição inválida: % não vai direto para %. O dado passa por cada etapa.',
      old.status, new.status
      using errcode = '23514';
  end if;

  if para > de and new.status in ('enviado', 'publicado') and not expedicao_tem_dado(new.id) then
    raise exception
      'Esta saída ainda não tem nenhum registro: nenhuma ocorrência, nenhuma contagem e nenhum trecho medido. Registre em campo ou transcreva a ficha antes de %.',
      case new.status when 'enviado' then 'enviar para revisão' else 'publicar' end
      using errcode = '23514';
  end if;

  if new.status = 'validado' then
    new.validado_por := coalesce(new.validado_por, auth.uid());
    new.validado_em  := coalesce(new.validado_em, now());
  end if;

  if para < de then
    new.validado_por := null;
    new.validado_em  := null;
  end if;

  return new;
end;
$$;

alter table expedicao alter column criado_por set default auth.uid();
