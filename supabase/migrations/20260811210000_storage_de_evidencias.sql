-- =====================================================================
-- Oceano na Escola — storage de evidências
--
-- O bucket é PRIVADO de propósito. A view pub_foto_georreferenciada
-- expõe storage_path ao anônimo; com bucket público, qualquer pessoa
-- com um caminho leria qualquer foto — inclusive as sem curadoria e as
-- da escola sem termo de uso de imagem. Privado, a leitura passa pelas
-- políticas abaixo e a foto sai por URL assinada.
--
-- O caminho carrega a escola: escola-<id>/exp-<n>/<arquivo>.jpg.
-- É o primeiro segmento que as políticas conferem.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do update set public = false;

-- Professor com vínculo envia foto para a pasta da própria escola.
drop policy if exists evidencias_envio on storage.objects;
create policy evidencias_envio on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidencias'
    and (storage.foldername(name))[1] ~ '^escola-[0-9]+$'
    and app_tem_vinculo(substring((storage.foldername(name))[1] from 8)::bigint)
  );

-- E lê e apaga as da sua escola — apagar cobre o pedido de remoção
-- em 72 horas do termo de parceria.
drop policy if exists evidencias_leitura_vinculo on storage.objects;
create policy evidencias_leitura_vinculo on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidencias'
    and (storage.foldername(name))[1] ~ '^escola-[0-9]+$'
    and app_tem_vinculo(substring((storage.foldername(name))[1] from 8)::bigint)
  );

drop policy if exists evidencias_remocao_vinculo on storage.objects;
create policy evidencias_remocao_vinculo on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'evidencias'
    and (storage.foldername(name))[1] ~ '^escola-[0-9]+$'
    and app_tem_vinculo(substring((storage.foldername(name))[1] from 8)::bigint)
  );

-- O público só alcança a foto que cumpre as três condições juntas:
-- curadoria (status publicada), escola publicada e termo de imagem.
-- É a mesma regra da view — repetida aqui porque o storage não passa
-- por ela. A checagem vive numa security definer: policy roda com o
-- privilégio de quem consulta, e o anon não tem grant em evidencia
-- nem escola.
create or replace function app_foto_publica(p_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from evidencia ev
    join escola e on e.id = ev.escola_id
    where ev.storage_path = p_path
      and ev.status = 'publicada'
      and e.publicada = true
      and e.termos_ok = true
  );
$$;

grant execute on function app_foto_publica(text) to anon, authenticated;

drop policy if exists evidencias_leitura_publica on storage.objects;
create policy evidencias_leitura_publica on storage.objects
  for select to anon
  using (bucket_id = 'evidencias' and app_foto_publica(name));
