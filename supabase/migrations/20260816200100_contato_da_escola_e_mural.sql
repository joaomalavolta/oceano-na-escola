-- =====================================================================
-- Oceano na Escola — contato da escola e mural
--
-- Duas coisas pedidas juntas para a página pública da escola:
--
--   1. Contato e números: quem coordena, como falar com a escola, onde
--      ela está nas redes, quantos participantes atende. Tudo opcional,
--      tudo público — é a escola se apresentando, e cada campo vazio
--      simplesmente não aparece.
--
--   2. Mural: o coordenador escreve, junta fotos ou vídeos curtos, e a
--      publicação aparece na página da escola e na linha do tempo da
--      rede. É o "o que estamos fazendo" fora das saídas de campo.
--
-- O mural não abre porta nova para imagem de criança. A mídia é
-- `evidencia`, como toda foto da plataforma: mesma política de Storage,
-- mesmo termo de imagem, mesmo pedido de remoção sem conta. O que muda é
-- que publicar a publicação publica a mídia dela — escrever no mural e
-- escolher o que vai junto é um ato só, de uma pessoa, registrada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Contato
-- ---------------------------------------------------------------------

alter table escola
  add column if not exists responsavel_nome          text,
  add column if not exists responsavel_funcao        text,
  add column if not exists contato_email             text,
  add column if not exists contato_telefone          text,
  add column if not exists contato_telefone_whatsapp boolean not null default false,
  add column if not exists contato_site              text,
  add column if not exists contato_instagram         text,
  add column if not exists contato_facebook          text,
  add column if not exists contato_youtube           text,
  add column if not exists participantes_atendidos   int;

-- As travas abaixo não são enfeite. Estes valores viram `href` na página
-- pública: um "site" escrito `javascript:...` seria código rodando no
-- navegador de cada visitante. Só http e https passam.
alter table escola
  drop constraint if exists escola_responsavel_nome_tam,
  add  constraint escola_responsavel_nome_tam
       check (responsavel_nome is null or length(responsavel_nome) between 1 and 120),
  drop constraint if exists escola_responsavel_funcao_tam,
  add  constraint escola_responsavel_funcao_tam
       check (responsavel_funcao is null or length(responsavel_funcao) between 1 and 80),
  drop constraint if exists escola_contato_email_formato,
  add  constraint escola_contato_email_formato
       check (contato_email is null or contato_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  drop constraint if exists escola_contato_telefone_formato,
  add  constraint escola_contato_telefone_formato
       check (contato_telefone is null or contato_telefone ~ '^\+?[0-9 ()-]{8,20}$'),
  drop constraint if exists escola_contato_site_url,
  add  constraint escola_contato_site_url
       check (contato_site is null or contato_site ~* '^https?://[^\s<>"]+$'),
  drop constraint if exists escola_contato_facebook_url,
  add  constraint escola_contato_facebook_url
       check (contato_facebook is null or contato_facebook ~* '^https?://[^\s<>"]+$'),
  drop constraint if exists escola_contato_youtube_url,
  add  constraint escola_contato_youtube_url
       check (contato_youtube is null or contato_youtube ~* '^https?://[^\s<>"]+$'),
  -- Instagram guarda só o nome de usuário; o link é montado na tela.
  drop constraint if exists escola_contato_instagram_formato,
  add  constraint escola_contato_instagram_formato
       check (contato_instagram is null or contato_instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  drop constraint if exists escola_participantes_faixa,
  add  constraint escola_participantes_faixa
       check (participantes_atendidos is null or participantes_atendidos between 0 and 100000);

grant update (responsavel_nome, responsavel_funcao, contato_email, contato_telefone,
              contato_telefone_whatsapp, contato_site, contato_instagram,
              contato_facebook, contato_youtube, participantes_atendidos)
  on escola to authenticated;

-- Fora de pub_escola de propósito: aquela é lida pelo mapa inteiro a
-- cada visita, e o contato só interessa a quem abre a página da escola.
create or replace view pub_escola_contato with (security_invoker = off) as
select e.slug,
       e.responsavel_nome,
       e.responsavel_funcao,
       e.contato_email,
       e.contato_telefone,
       e.contato_telefone_whatsapp,
       e.contato_site,
       e.contato_instagram,
       e.contato_facebook,
       e.contato_youtube,
       e.participantes_atendidos
from escola e
where e.publicada = true;

grant select on pub_escola_contato to anon, authenticated;

-- ---------------------------------------------------------------------
-- Mural
-- ---------------------------------------------------------------------

create table if not exists mural_publicacao (
  id            bigserial primary key,
  escola_id     bigint not null references escola(id) on delete cascade,
  texto         text not null check (length(trim(texto)) between 1 and 2000),
  publicada     boolean not null default false,
  publicada_em  timestamptz,
  publicada_por uuid references perfil(id),
  criado_por    uuid references perfil(id) default auth.uid(),
  criado_em     timestamptz not null default now()
);

comment on table mural_publicacao is
  'Mural da escola: texto do coordenador com fotos ou vídeos curtos. Aparece na página da escola e na linha do tempo da rede.';

create index if not exists mural_publicacao_escola_idx
  on mural_publicacao (escola_id, publicada, publicada_em desc);

alter table mural_publicacao enable row level security;

drop policy if exists mural_tudo on mural_publicacao;
create policy mural_tudo on mural_publicacao for all to authenticated
  using (app_tem_vinculo(escola_id))
  with check (app_tem_vinculo(escola_id));

revoke all on mural_publicacao from anon;
revoke truncate, references, trigger on mural_publicacao from authenticated;

alter table evidencia
  add column if not exists publicacao_id bigint references mural_publicacao(id) on delete cascade;

create index if not exists evidencia_publicacao_idx on evidencia (publicacao_id) where publicacao_id is not null;

/*
  Publicar e retirar são funções, e não dois updates do cliente: a
  publicação e a mídia dela mudam juntas ou não mudam. Com dois updates,
  uma falha no meio deixaria o texto no ar com as fotos fora, ou o
  contrário — e o contrário é foto pública sem o texto que a explica.
*/
create or replace function publicar_no_mural(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_escola bigint;
begin
  select escola_id into v_escola from mural_publicacao where id = p_id;
  if not found then
    raise exception 'Publicação não encontrada.' using errcode = 'P0002';
  end if;
  if not app_tem_vinculo(v_escola) then
    raise exception 'Só quem responde pela escola publica no mural dela.' using errcode = '42501';
  end if;

  update mural_publicacao
     set publicada = true,
         publicada_em = coalesce(publicada_em, now()),
         publicada_por = auth.uid()
   where id = p_id;

  -- Mídia com pedido de remoção em aberto não volta ao ar por aqui.
  update evidencia ev
     set status = 'publicada',
         publicada_em = now(),
         curada_por = auth.uid()
   where ev.publicacao_id = p_id
     and ev.status = 'despublicada'
     and not exists (select 1 from solicitacao_remocao r
                      where r.evidencia_id = ev.id and r.atendida_em is null);
end;
$$;

create or replace function retirar_do_mural(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_escola bigint;
begin
  select escola_id into v_escola from mural_publicacao where id = p_id;
  if not found then
    raise exception 'Publicação não encontrada.' using errcode = 'P0002';
  end if;
  if not app_tem_vinculo(v_escola) then
    raise exception 'Só quem responde pela escola mexe no mural dela.' using errcode = '42501';
  end if;

  update mural_publicacao set publicada = false where id = p_id;
  update evidencia set status = 'despublicada', publicada_em = null
   where publicacao_id = p_id and status = 'publicada';
end;
$$;

revoke execute on function publicar_no_mural(bigint) from anon, public;
revoke execute on function retirar_do_mural(bigint) from anon, public;
grant  execute on function publicar_no_mural(bigint) to authenticated;
grant  execute on function retirar_do_mural(bigint) to authenticated;

-- A foto do mural só sai do Storage para o visitante se a publicação a
-- que pertence estiver no ar. Sem isto, quem guardou o caminho de uma
-- foto continuaria abrindo-a depois de o coordenador retirar o texto.
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
      and (ev.publicacao_id is null
           or exists (select 1 from mural_publicacao p
                       where p.id = ev.publicacao_id and p.publicada))
  );
$$;

-- ---------------------------------------------------------------------
-- Camada pública do mural
-- ---------------------------------------------------------------------

create or replace view pub_mural with (security_invoker = off) as
select p.id,
       p.texto,
       p.publicada_em,
       e.slug as escola_slug,
       e.nome as escola_nome
from mural_publicacao p
join escola e on e.id = p.escola_id and e.publicada = true
where p.publicada = true;

-- A mídia tem a trava a mais de toda imagem: termo de uso de imagem.
-- Sem ele, a publicação aparece só com o texto.
create or replace view pub_mural_midia with (security_invoker = off) as
select ev.id,
       ev.publicacao_id,
       ev.storage_path,
       ev.tipo::text as tipo,
       ev.legenda
from evidencia ev
join mural_publicacao p on p.id = ev.publicacao_id and p.publicada = true
join escola e on e.id = ev.escola_id and e.publicada = true and e.termos_ok = true
where ev.status = 'publicada'
  and ev.tipo in ('foto_mural', 'video_mural');

comment on view pub_mural_midia is
  'Servir com cabecalho noindex, como a galeria.';

grant select on pub_mural, pub_mural_midia to anon, authenticated;
