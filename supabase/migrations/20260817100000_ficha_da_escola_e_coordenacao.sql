-- =====================================================================
-- Oceano na Escola — ficha da escola e coordenação
--
-- A página pública passa a contar quando a escola começou, em que dias
-- dá aula e quem a coordena — com foto e contato de cada coordenador.
--
-- Coordenação vira tabela própria porque é "uma ou mais pessoas", e um
-- par de colunas na escola só cabia uma. As colunas responsavel_nome e
-- responsavel_funcao, da entrega anterior, são copiadas para cá e ficam
-- sem uso na tela: apagá-las quebraria a view pub_escola_contato, que
-- `create or replace` não deixa encolher.
--
-- Foto de coordenador é foto de adulto que aceitou aparecer. Não passa
-- pelo termo de uso de imagem dos alunos, que é outra coisa: passa pela
-- marca `autorizado`, que a escola declara por pessoa. Sem ela, nem a
-- foto nem o contato daquela pessoa aparecem.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fundação e dias de aula
-- ---------------------------------------------------------------------

alter table escola
  add column if not exists fundada_em    date,
  add column if not exists dias_aula     text[] not null default '{}',
  add column if not exists horario_aulas text;

alter table escola
  drop constraint if exists escola_fundada_em_faixa,
  -- Limites fixos, e não `current_date`: constraint precisa dar o mesmo
  -- resultado amanhã. "Não pode ser no futuro" é conferido na tela.
  add  constraint escola_fundada_em_faixa
       check (fundada_em is null or fundada_em between date '1900-01-01' and date '2100-01-01'),
  drop constraint if exists escola_dias_aula_validos,
  add  constraint escola_dias_aula_validos
       check (dias_aula <@ array['seg','ter','qua','qui','sex','sab','dom']::text[]),
  drop constraint if exists escola_horario_aulas_tam,
  add  constraint escola_horario_aulas_tam
       check (horario_aulas is null or length(horario_aulas) between 1 and 120);

grant update (fundada_em, dias_aula, horario_aulas) on escola to authenticated;

-- O mapa precisa destes campos para o balão do pino, por isso entram em
-- pub_escola — e no fim, como sempre. São poucos bytes por escola.
create or replace view pub_escola with (security_invoker = off) as
select e.id,
       e.slug,
       e.nome,
       e.apresentacao,
       m.nome as municipio,
       m.uf,
       st_y(e.geom::geometry) as lat,
       st_x(e.geom::geometry) as lng,
       e.tipo,
       (select ev.storage_path
          from evidencia ev
         where ev.escola_id = e.id
           and ev.tipo = 'capa_escola'
           and ev.status = 'publicada'
           and e.termos_ok = true
         limit 1) as capa_path,
       e.fundada_em,
       e.dias_aula,
       e.horario_aulas,
       e.participantes_atendidos
from escola e
join municipio m on m.id = e.municipio_id
where e.publicada = true
  and e.geom is not null;

grant select on pub_escola to anon, authenticated;

-- ---------------------------------------------------------------------
-- Coordenação
-- ---------------------------------------------------------------------

create table if not exists escola_coordenador (
  id                 bigserial primary key,
  escola_id          bigint not null references escola(id) on delete cascade,
  nome               text not null check (length(trim(nome)) between 1 and 120),
  funcao             text check (funcao is null or length(funcao) between 1 and 80),
  email              text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefone           text check (telefone is null or telefone ~ '^\+?[0-9 ()-]{8,20}$'),
  telefone_whatsapp  boolean not null default false,
  instagram          text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  -- A foto mora na pasta da própria escola: é o que a política do
  -- Storage confere para deixar enviar.
  foto_path          text check (foto_path is null
                                 or foto_path like 'escola-' || escola_id::text || '/coordenacao/%'),
  autorizado         boolean not null default false,
  ordem              int not null default 0,
  criado_em          timestamptz not null default now()
);

comment on column escola_coordenador.autorizado is
  'A pessoa autorizou aparecer na página pública com foto e contato. Sem isto, nada dela é publicado.';

create index if not exists escola_coordenador_escola_idx on escola_coordenador (escola_id, ordem);

alter table escola_coordenador enable row level security;

drop policy if exists coordenador_tudo on escola_coordenador;
create policy coordenador_tudo on escola_coordenador for all to authenticated
  using (app_tem_vinculo(escola_id))
  with check (app_tem_vinculo(escola_id));

revoke all on escola_coordenador from anon;
revoke truncate, references, trigger on escola_coordenador from authenticated;

-- O responsável da entrega anterior vira o primeiro coordenador. Foi a
-- própria escola que o pôs na página pública, então já estava autorizado.
insert into escola_coordenador (escola_id, nome, funcao, autorizado, ordem)
select e.id, e.responsavel_nome, e.responsavel_funcao, true, 0
from escola e
where e.responsavel_nome is not null
  and not exists (select 1 from escola_coordenador c where c.escola_id = e.id);

create or replace view pub_escola_coordenador with (security_invoker = off) as
select c.id,
       e.slug as escola_slug,
       c.nome,
       c.funcao,
       c.email,
       c.telefone,
       c.telefone_whatsapp,
       c.instagram,
       c.foto_path,
       c.ordem
from escola_coordenador c
join escola e on e.id = c.escola_id and e.publicada = true
where c.autorizado = true;

grant select on pub_escola_coordenador to anon, authenticated;

-- A foto do coordenador sai do Storage para o visitante pela mesma
-- função das outras, com um ramo a mais: pessoa autorizada, escola
-- publicada. O termo de imagem dos alunos não entra nesta conta.
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
  )
  or exists (
    select 1
    from escola_coordenador c
    join escola e on e.id = c.escola_id
    where c.foto_path = p_path
      and c.autorizado = true
      and e.publicada = true
  );
$$;
