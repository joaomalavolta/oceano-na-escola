-- =====================================================================
-- Oceano na Escola — 20260810203037_schema_oceano_na_escola.sql
-- Instituto Ecosurf · Supabase / PostgreSQL + PostGIS
-- =====================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------

create type papel_usuario as enum (
  'professor',
  'coordenacao_escolar',
  'coordenacao_municipal',
  'pesquisador',
  'admin_ecosurf'
);

create type status_dado as enum (
  'rascunho', 'enviado', 'revisado', 'validado', 'publicado'
);

create type status_evidencia as enum (
  'publicada', 'despublicada', 'removida'
);

create type tipo_campo as enum (
  'texto', 'texto_longo', 'inteiro', 'decimal', 'data', 'hora',
  'selecao', 'multi_selecao', 'coordenada', 'imagem', 'booleano'
);

create type tipo_unidade_amostral as enum ('trecho', 'quadrat', 'ponto', 'area');

create type tipo_evidencia as enum (
  'foto_campo', 'foto_quadrat', 'ficha_digitalizada', 'documento'
);

-- ---------------------------------------------------------------------
-- Território e rede
-- ---------------------------------------------------------------------

create table municipio (
  id          bigserial primary key,
  nome        text not null,
  uf          char(2) not null,
  geom        geography(Point, 4326),
  unique (nome, uf)
);

create table escola (
  id           bigserial primary key,
  municipio_id bigint not null references municipio(id),
  nome         text not null,
  slug         text not null unique,
  rede_ensino  text,
  endereco     text,
  geom         geography(Point, 4326),
  apresentacao text,
  publicada    boolean not null default false,
  termos_ok    boolean not null default false,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on column escola.termos_ok is
  'Escola confirmou ter colhido termo de responsabilidade e de uso de imagem. Trava a publicação da galeria.';

create table territorio (
  id           bigserial primary key,
  municipio_id bigint not null references municipio(id),
  nome         text not null,
  tipo         text not null,           -- praia, restinga, foz, manguezal, costao
  geom         geography(Geometry, 4326)
);

create table turma (
  id         bigserial primary key,
  escola_id  bigint not null references escola(id) on delete cascade,
  nome       text not null,
  ano_letivo int not null,
  nivel      text,
  criado_em  timestamptz not null default now(),
  unique (escola_id, nome, ano_letivo)
);

-- ---------------------------------------------------------------------
-- Pessoas
-- ---------------------------------------------------------------------

create table perfil (
  id        uuid primary key references auth.users(id) on delete cascade,
  nome      text not null,
  papel     papel_usuario not null default 'professor',
  criado_em timestamptz not null default now()
);

create table vinculo_escola (
  perfil_id uuid   not null references perfil(id) on delete cascade,
  escola_id bigint not null references escola(id) on delete cascade,
  primary key (perfil_id, escola_id)
);

comment on table vinculo_escola is
  'Coordenação municipal e Ecosurf podem ter vínculo com várias escolas.';

-- ---------------------------------------------------------------------
-- Protocolos (a ficha é o schema)
-- ---------------------------------------------------------------------

create table protocolo (
  id        bigserial primary key,
  codigo    text not null unique,       -- RES, MIC, RST, AVI
  nome      text not null,
  descricao text
);

create table protocolo_versao (
  id           bigserial primary key,
  protocolo_id bigint not null references protocolo(id) on delete cascade,
  versao       text not null,           -- '1.0'
  metodo       text,
  publicada_em timestamptz,
  ativa        boolean not null default true,
  unique (protocolo_id, versao)
);

create table protocolo_secao (
  id       bigserial primary key,
  versao_id bigint not null references protocolo_versao(id) on delete cascade,
  codigo   text not null,               -- esforco, contagem, qualitativo
  nome     text not null,
  ordem    int not null,
  unique (versao_id, codigo)
);

create table protocolo_campo (
  id           bigserial primary key,
  secao_id     bigint not null references protocolo_secao(id) on delete cascade,
  codigo       text not null,
  rotulo       text not null,
  tipo         tipo_campo not null,
  unidade      text,                    -- m, m2, cm, mm, kg
  obrigatorio  boolean not null default false,
  valor_padrao text,
  opcoes       jsonb,                   -- para selecao / multi_selecao
  ordem        int not null,
  unique (secao_id, codigo)
);

create table protocolo_item (
  id        bigserial primary key,
  versao_id bigint not null references protocolo_versao(id) on delete cascade,
  codigo    text not null,              -- PL01, EP02, MT03
  nome      text not null,
  grupo     text not null,              -- Plástico, Isopor e espumas
  ordem     int not null,
  unique (versao_id, codigo)
);

-- ---------------------------------------------------------------------
-- Expedição
-- ---------------------------------------------------------------------

create table expedicao (
  id             bigserial primary key,
  escola_id      bigint not null references escola(id) on delete cascade,
  turma_id       bigint not null references turma(id),
  territorio_id  bigint references territorio(id),
  numero         int not null,
  titulo         text,
  data_campo     date not null,
  hora_inicio    time,
  hora_fim       time,
  ponto_inicial  geography(Point, 4326),
  ponto_final    geography(Point, 4326),
  percurso       geography(LineString, 4326),
  extensao_m     numeric(10,2),
  n_mapeadores   int,
  n_equipes      int,
  mare           text,                  -- enchente, vazante, preamar, baixamar
  chuva_24h      text,                  -- sim, nao, nao_sei
  vento          text,
  observacoes    text,
  status         status_dado not null default 'rascunho',
  criado_por     uuid references perfil(id),
  validado_por   uuid references perfil(id),
  validado_em    timestamptz,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (escola_id, numero)
);

comment on column expedicao.data_campo is
  'Data da saída de campo, nunca a da digitação. O carimbo de digitação é criado_em.';

create table equipe (
  id           bigserial primary key,
  expedicao_id bigint not null references expedicao(id) on delete cascade,
  identificacao text not null,          -- E1, E2
  n_mapeadores int,
  unique (expedicao_id, identificacao)
);

create table unidade_amostral (
  id              bigserial primary key,
  expedicao_id    bigint not null references expedicao(id) on delete cascade,
  equipe_id       bigint references equipe(id) on delete cascade,
  versao_id       bigint not null references protocolo_versao(id),
  tipo            tipo_unidade_amostral not null,
  ordem           int not null default 1,
  geom            geography(Geometry, 4326),
  comprimento_m   numeric(10,2),
  largura_m       numeric(10,2),
  area_m2         numeric(12,4),
  profundidade_cm numeric(6,2),
  malha_mm        numeric(6,2),
  posicao_praia   text,
  distancia_m     numeric(10,2),
  peso_kg         numeric(10,3),
  metadados       jsonb not null default '{}'::jsonb,
  criado_em       timestamptz not null default now()
);

comment on table unidade_amostral is
  'Trecho de 50 m do protocolo de resíduos ou quadrat de 0,25 m2 do de microplásticos. Sem esforço amostral não há densidade.';

create table observacao_contagem (
  id          bigserial primary key,
  unidade_id  bigint not null references unidade_amostral(id) on delete cascade,
  item_id     bigint references protocolo_item(id),
  campo_id    bigint references protocolo_campo(id),
  quantidade  int not null check (quantidade >= 0),
  descricao   text,
  check (item_id is not null or campo_id is not null)
);

comment on column observacao_contagem.campo_id is
  'Usado quando a contagem é por classe declarada em campo (microplásticos), não por item de lista.';

create table observacao_pontual (
  id              bigserial primary key,
  expedicao_id    bigint not null references expedicao(id) on delete cascade,
  equipe_id       bigint references equipe(id),
  versao_id       bigint not null references protocolo_versao(id),
  descricao       text not null,
  geom            geography(Point, 4326) not null,
  origem_provavel text,
  observacao      text,
  criado_em       timestamptz not null default now()
);

create table observacao_texto (
  id           bigserial primary key,
  expedicao_id bigint not null references expedicao(id) on delete cascade,
  equipe_id    bigint references equipe(id),
  campo_id     bigint not null references protocolo_campo(id),
  valor        text
);

-- ---------------------------------------------------------------------
-- Evidências e remoção de imagem
-- ---------------------------------------------------------------------

create table evidencia (
  id            bigserial primary key,
  expedicao_id  bigint references expedicao(id) on delete cascade,
  escola_id     bigint not null references escola(id) on delete cascade,
  pontual_id    bigint references observacao_pontual(id) on delete cascade,
  unidade_id    bigint references unidade_amostral(id) on delete cascade,
  tipo          tipo_evidencia not null,
  storage_path  text not null,
  legenda       text,
  status        status_evidencia not null default 'despublicada',
  publicada_em  timestamptz,
  curada_por    uuid references perfil(id),
  criado_por    uuid references perfil(id),
  criado_em     timestamptz not null default now()
);

comment on column evidencia.status is
  'Galeria pública exige curadoria do professor ou coordenador e escola.termos_ok = true.';

create table solicitacao_remocao (
  id                  bigserial primary key,
  evidencia_id        bigint not null references evidencia(id) on delete cascade,
  solicitante_nome    text not null,
  solicitante_contato text not null,
  motivo              text,
  criado_em           timestamptz not null default now(),
  prazo_em            timestamptz not null default (now() + interval '72 hours'),
  atendida_em         timestamptz,
  atendida_por        uuid references perfil(id)
);

comment on table solicitacao_remocao is
  'Prazo de 72 horas para remoção mediante pedido formalizado, conforme termo de parceria.';

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------

create index on escola using gist (geom);
create index on territorio using gist (geom);
create index on expedicao using gist (ponto_inicial);
create index on expedicao using gist (percurso);
create index on unidade_amostral using gist (geom);
create index on observacao_pontual using gist (geom);

create index on expedicao (escola_id, status);
create index on expedicao (data_campo);
create index on unidade_amostral (expedicao_id);
create index on observacao_contagem (unidade_id);
create index on evidencia (escola_id, status);

-- ---------------------------------------------------------------------
-- Trigger de atualização
-- ---------------------------------------------------------------------

create or replace function set_atualizado_em()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

create trigger trg_escola_atualizado
  before update on escola
  for each row execute function set_atualizado_em();

create trigger trg_expedicao_atualizado
  before update on expedicao
  for each row execute function set_atualizado_em();
