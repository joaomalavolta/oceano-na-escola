/*
  Lixo no mar: quanto, de quê, e de que marca.

  Decidido em 12/11/2026 (item 1.b do protocolo LIM). Cada ponto de lixo
  no mar pode levar:

    - a QUANTIDADE ESTIMADA de itens no ponto;
    - a CONTAGEM POR TIPO, opcional, usando a lista de itens de RES
      (garrafa PET, copo, embalagem de alimento, fragmento de plástico…).
      É a lista já aprovada: os mesmos nomes nos dois protocolos permitem
      comparar o que se conta por área com o que se marca por ponto;
    - o VOLUME EM SACOS, com o tamanho do saco em litros quando se sabe.
      O tamanho não tem padrão escolhido aqui: sem ele, "2 sacos" não se
      compara com "2 sacos" de outra escola, e por isso ele é registrado
      junto em vez de suposto;
    - o MATERIAL PREDOMINANTE, entre os grupos de material da lista de
      RES, mais "misto" quando nenhum predomina;
    - as MARCAS identificadas, com quantos itens de cada.

  Três tabelas, e não um campo de texto: o ranking de marcas soma a rede
  inteira, e soma pede dado estruturado.

  A marca é digitada como se lê na embalagem. Para "Marca", "marca " e
  "MARCA" contarem como uma só, cada marca guarda uma chave normalizada
  (minúscula, sem acento, espaços colapsados). O ranking mostra a grafia
  mais usada para cada chave.

  Acesso igual ao da ocorrência: escreve quem tem vínculo com a escola;
  lê quem tem vínculo e o pesquisador. Em público, só o que é de saída
  publicada de escola publicada — pelas visões no fim.
*/

-- ---------------------------------------------------------------------
-- Chave da marca
-- ---------------------------------------------------------------------

create or replace function marca_chave(p text)
returns text
language sql
immutable
parallel safe
as $$
  select regexp_replace(
           translate(lower(btrim(coalesce(p, ''))),
                     'áàâãäéèêëíìîïóòôõöúùûüçñ',
                     'aaaaaeeeeiiiiooooouuuucn'),
           '\s+', ' ', 'g');
$$;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table if not exists lixo_no_ponto (
  pontual_id          bigint primary key references observacao_pontual(id) on delete cascade,
  quantidade_estimada integer check (quantidade_estimada between 0 and 100000),
  sacos               numeric(6,1) check (sacos between 0 and 1000),
  litros_por_saco     integer check (litros_por_saco between 1 and 1000),
  material            text check (material in (
                        'plastico', 'isopor', 'metal', 'vidro', 'papel',
                        'borracha', 'tecido', 'madeira', 'saude', 'outros', 'misto')),
  criado_em           timestamptz not null default now(),
  check (litros_por_saco is null or sacos is not null)
);

comment on table lixo_no_ponto is
  'Quantidade, volume e material de um ponto do protocolo LIM (lixo no mar).';

create table if not exists lixo_no_ponto_item (
  pontual_id bigint not null references observacao_pontual(id) on delete cascade,
  item_id    bigint not null references protocolo_item(id),
  quantidade integer not null check (quantidade between 1 and 100000),
  primary key (pontual_id, item_id)
);

comment on table lixo_no_ponto_item is
  'Contagem por tipo num ponto de lixo no mar, com os itens da lista de RES.';

create table if not exists lixo_no_ponto_marca (
  id          bigserial primary key,
  pontual_id  bigint not null references observacao_pontual(id) on delete cascade,
  marca       text not null check (length(btrim(marca)) between 1 and 80),
  marca_chave text generated always as (marca_chave(marca)) stored,
  quantidade  integer not null check (quantidade between 1 and 100000),
  unique (pontual_id, marca_chave)
);

create index if not exists lixo_marca_chave on lixo_no_ponto_marca (marca_chave);

comment on table lixo_no_ponto_marca is
  'Marcas identificadas nos itens de um ponto de lixo no mar. Base do ranking de marcas.';

-- ---------------------------------------------------------------------
-- Coerência: só ponto de LIM, só item de RES
-- ---------------------------------------------------------------------

-- Com definer: a conferência precisa enxergar o ponto para dizer se ele
-- é de LIM. Com os direitos de quem grava, uma conta sem vínculo não o
-- veria e levaria a mensagem errada ("não é de LIM") no lugar da
-- recusa de permissão, que vem logo depois, pela política.
create or replace function confere_lixo_no_ponto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
      from observacao_pontual op
      join protocolo_versao pv on pv.id = op.versao_id
      join protocolo p on p.id = pv.protocolo_id
     where op.id = new.pontual_id and p.codigo = 'LIM'
  ) then
    raise exception 'Quantidade, material e marcas são do protocolo Lixo no mar.' using errcode = '23514';
  end if;

  -- Dois `if` e não um `and`: o PL/pgSQL resolve `new.item_id` mesmo
  -- quando a primeira condição é falsa, e nas outras tabelas o campo não
  -- existe.
  if tg_table_name = 'lixo_no_ponto_item' then
    if not exists (
      select 1
        from protocolo_item i
        join protocolo_versao pv on pv.id = i.versao_id
        join protocolo p on p.id = pv.protocolo_id
       where i.id = (to_jsonb(new) ->> 'item_id')::bigint and p.codigo = 'RES'
    ) then
      raise exception 'A contagem por tipo usa os itens da lista de resíduos (RES).' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function confere_lixo_no_ponto() from anon, public;

drop trigger if exists trg_lixo_no_ponto on lixo_no_ponto;
create trigger trg_lixo_no_ponto before insert or update on lixo_no_ponto
  for each row execute function confere_lixo_no_ponto();
drop trigger if exists trg_lixo_no_ponto_item on lixo_no_ponto_item;
create trigger trg_lixo_no_ponto_item before insert or update on lixo_no_ponto_item
  for each row execute function confere_lixo_no_ponto();
drop trigger if exists trg_lixo_no_ponto_marca on lixo_no_ponto_marca;
create trigger trg_lixo_no_ponto_marca before insert or update on lixo_no_ponto_marca
  for each row execute function confere_lixo_no_ponto();

-- ---------------------------------------------------------------------
-- Acesso
-- ---------------------------------------------------------------------

alter table lixo_no_ponto       enable row level security;
alter table lixo_no_ponto_item  enable row level security;
alter table lixo_no_ponto_marca enable row level security;

revoke all on lixo_no_ponto, lixo_no_ponto_item, lixo_no_ponto_marca from anon;
revoke all on lixo_no_ponto, lixo_no_ponto_item, lixo_no_ponto_marca from authenticated;
grant select, insert, update, delete on lixo_no_ponto, lixo_no_ponto_item, lixo_no_ponto_marca to authenticated;
grant usage, select on sequence lixo_no_ponto_marca_id_seq to authenticated;

do $$
declare t text;
begin
  foreach t in array array['lixo_no_ponto', 'lixo_no_ponto_item', 'lixo_no_ponto_marca'] loop
    execute format('drop policy if exists %1$s_tudo on %1$s', t);
    execute format($p$
      create policy %1$s_tudo on %1$s for all to authenticated
        using (exists (
          select 1 from observacao_pontual op join expedicao e on e.id = op.expedicao_id
           where op.id = %1$s.pontual_id
             and (app_tem_vinculo(e.escola_id) or app_is_pesquisador())))
        with check (exists (
          select 1 from observacao_pontual op join expedicao e on e.id = op.expedicao_id
           where op.id = %1$s.pontual_id and app_tem_vinculo(e.escola_id)))
    $p$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Em público
-- ---------------------------------------------------------------------

-- O detalhe de cada ponto publicado, para o balão do pino.
create or replace view pub_lixo_no_ponto as
select op.id as pontual_id,
       l.quantidade_estimada,
       l.sacos,
       l.litros_por_saco,
       l.material,
       coalesce((select json_agg(json_build_object('nome', pi.nome, 'quantidade', li.quantidade)
                                 order by li.quantidade desc, pi.nome)
                   from lixo_no_ponto_item li join protocolo_item pi on pi.id = li.item_id
                  where li.pontual_id = op.id), '[]'::json) as itens,
       coalesce((select json_agg(json_build_object('marca', m.marca, 'quantidade', m.quantidade)
                                 order by m.quantidade desc, m.marca)
                   from lixo_no_ponto_marca m
                  where m.pontual_id = op.id), '[]'::json) as marcas
  from observacao_pontual op
  join expedicao x on x.id = op.expedicao_id and x.status = 'publicado'
  join escola e on e.id = x.escola_id and e.publicada = true
  left join lixo_no_ponto l on l.pontual_id = op.id
 where l.pontual_id is not null
    or exists (select 1 from lixo_no_ponto_marca m where m.pontual_id = op.id)
    or exists (select 1 from lixo_no_ponto_item li where li.pontual_id = op.id);

/*
  O ranking de marcas da rede.

  Soma os itens com marca identificada nos pontos publicados. Não mede
  participação de mercado nem responsabilidade de ninguém: diz quantos
  itens de cada marca as escolas encontraram e registraram. A grafia
  exibida é a mais usada para a mesma chave.
*/
create or replace view pub_ranking_marcas as
with base as (
  select m.marca, m.marca_chave, m.quantidade, op.id as pontual_id, x.escola_id
    from lixo_no_ponto_marca m
    join observacao_pontual op on op.id = m.pontual_id
    join expedicao x on x.id = op.expedicao_id and x.status = 'publicado'
    join escola e on e.id = x.escola_id and e.publicada = true
),
grafia as (
  select distinct on (marca_chave) marca_chave, marca
    from (select marca_chave, btrim(marca) as marca, count(*) n from base group by 1, 2) g
   order by marca_chave, n desc, marca
)
select g.marca,
       b.marca_chave,
       sum(b.quantidade)::bigint          as itens,
       count(distinct b.pontual_id)::bigint as pontos,
       count(distinct b.escola_id)::bigint  as escolas
  from base b
  join grafia g using (marca_chave)
 group by g.marca, b.marca_chave;

revoke all on pub_lixo_no_ponto, pub_ranking_marcas from anon, authenticated;
grant select on pub_lixo_no_ponto, pub_ranking_marcas to anon, authenticated;

-- A magnitude do ponto passa a ser a quantidade estimada, em itens.
update protocolo set unidade_medida = 'itens' where codigo = 'LIM';
update protocolo_item pi set unidade = 'itens'
  from protocolo_versao pv join protocolo p on p.id = pv.protocolo_id
 where pi.versao_id = pv.id and p.codigo = 'LIM';
