-- =====================================================================
-- Oceano na Escola — Diário de Campo e Histórias do Território
--
-- Duas peças que o plano de produção pede e que não existiam:
--
--   Diário de Campo — o antigo Diário de Bordo do Rio do Nosso Bairro,
--   agora preso à expedição. O manual de Mapa Verde organiza o processo
--   em antes, durante e depois do mapeamento, e é essa a divisão aqui.
--
--   História do Território — o recurso de educomunicação: mapa, texto,
--   fotos e indicadores juntos, para a escola dizer o que os dados
--   significam. O sistema não pergunta só "quantos resíduos achamos?",
--   mas "o que isso diz deste território?".
--
-- A privacidade separa os dois. O diário é escrita de estudante em
-- processo: fica dentro da escola, como as fichas e as fotos sem
-- curadoria. A história é o artefato curado, escrito para sair — e só
-- sai quando a escola publica.
-- =====================================================================

create type momento_campo as enum ('antes', 'durante', 'depois');

comment on type momento_campo is
  'Antes, durante e depois do mapeamento: a divisão do manual de Mapa Verde.';

-- ---------------------------------------------------------------------
-- Diário de Campo
-- ---------------------------------------------------------------------

create table diario_entrada (
  id            bigserial primary key,
  expedicao_id  bigint not null references expedicao(id) on delete cascade,
  turma_id      bigint references turma(id) on delete set null,
  momento       momento_campo not null default 'durante',
  titulo        text,
  texto         text not null check (length(trim(texto)) > 0),
  -- Quem escreveu no papel pode não ter conta: a turma assina, e o
  -- professor que digitou fica em criado_por.
  autoria       text,
  criado_por    uuid references perfil(id),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table diario_entrada is
  'Diário de Campo da expedição. Interno à escola: escrita de estudante em processo não é dado público.';

create index diario_entrada_expedicao_idx on diario_entrada (expedicao_id, momento);

-- ---------------------------------------------------------------------
-- Histórias do Território
-- ---------------------------------------------------------------------

create table historia (
  id            bigserial primary key,
  escola_id     bigint not null references escola(id) on delete cascade,
  slug          text not null,
  titulo        text not null check (length(trim(titulo)) > 0),
  resumo        text,
  corpo         text not null default '',
  -- Foto de capa: precisa ser evidência já curada para a história
  -- publicada mostrá-la. A view confere.
  capa_id       bigint references evidencia(id) on delete set null,
  publicada     boolean not null default false,
  publicada_em  timestamptz,
  criado_por    uuid references perfil(id),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (escola_id, slug)
);

comment on table historia is
  'História do Território: mapa, texto, fotos e indicadores juntos. O que os dados dizem do lugar.';

-- Quais expedições a história narra. É daqui que a página pública tira
-- o mapa e os números — a história não repete o dado, aponta para ele.
create table historia_expedicao (
  historia_id  bigint not null references historia(id) on delete cascade,
  expedicao_id bigint not null references expedicao(id) on delete cascade,
  primary key (historia_id, expedicao_id)
);

create index historia_escola_idx on historia (escola_id, publicada);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------

alter table diario_entrada     enable row level security;
alter table historia           enable row level security;
alter table historia_expedicao enable row level security;

create policy diario_tudo on diario_entrada for all to authenticated
  using (exists (select 1 from expedicao e where e.id = expedicao_id
                 and (app_tem_vinculo(e.escola_id) or app_is_pesquisador())))
  with check (exists (select 1 from expedicao e where e.id = expedicao_id
                      and app_tem_vinculo(e.escola_id)));

create policy historia_tudo on historia for all to authenticated
  using (app_tem_vinculo(escola_id) or app_is_pesquisador())
  with check (app_tem_vinculo(escola_id));

create policy historia_expedicao_tudo on historia_expedicao for all to authenticated
  using (exists (select 1 from historia h where h.id = historia_id
                 and (app_tem_vinculo(h.escola_id) or app_is_pesquisador())))
  with check (exists (select 1 from historia h where h.id = historia_id
                      and app_tem_vinculo(h.escola_id)));

-- ---------------------------------------------------------------------
-- Camada pública
-- ---------------------------------------------------------------------

-- Três travas, como no resto: história publicada, escola publicada e —
-- para a capa aparecer — evidência curada com termo de imagem. Sem a
-- terceira, a história sai sem capa em vez de vazar a foto.
create view pub_historia with (security_invoker = off) as
select h.id,
       h.slug,
       h.titulo,
       h.resumo,
       h.corpo,
       h.publicada_em,
       e.slug as escola_slug,
       e.nome as escola_nome,
       m.nome as municipio,
       m.uf,
       case
         when ev.id is not null and ev.status = 'publicada' and e.termos_ok
           then ev.storage_path
         else null
       end as capa_storage_path,
       (select coalesce(
                 array_agg(x.numero order by x.numero),
                 array[]::int[])
          from historia_expedicao he
          join expedicao x on x.id = he.expedicao_id and x.status = 'publicado'
         where he.historia_id = h.id) as expedicoes
from historia h
join escola e   on e.id = h.escola_id and e.publicada = true
join municipio m on m.id = e.municipio_id
left join evidencia ev on ev.id = h.capa_id
where h.publicada = true;

comment on view pub_historia is
  'Histórias publicadas de escolas publicadas. A capa só aparece com curadoria e termo de imagem.';

grant select on pub_historia to anon, authenticated;

-- ---------------------------------------------------------------------
-- Carimbo de atualização
-- ---------------------------------------------------------------------

create or replace function toca_atualizado_em()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger trg_diario_atualizado before update on diario_entrada
  for each row execute function toca_atualizado_em();

create trigger trg_historia_atualizado before update on historia
  for each row execute function toca_atualizado_em();

-- Publicar carimba a data; despublicar apaga, para a página pública
-- nunca mostrar data de publicação de história retirada do ar.
create or replace function marca_publicacao_historia()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.publicada and not coalesce(old.publicada, false) then
    new.publicada_em := coalesce(new.publicada_em, now());
  elsif not new.publicada then
    new.publicada_em := null;
  end if;
  return new;
end;
$$;

create trigger trg_historia_publicacao before insert or update of publicada on historia
  for each row execute function marca_publicacao_historia();
