-- =====================================================================
-- Oceano na Escola — capa da escola e fotos da turma
--
-- A escola passa a ter foto de capa, e a galeria passa a aceitar foto da
-- turma e da saída de campo enviadas fora do registro de ocorrência. É o
-- que alimenta a linha do tempo da rede: uma escola acompanha o que a
-- outra está fazendo pelas datas de campo e pelas imagens.
--
-- Nenhuma trava nova, e nenhuma a menos. Toda foto continua passando
-- pelas mesmas três portas — curadoria de uma pessoa, escola publicada e
-- termo de uso de imagem — e o pedido de remoção vale igual. O que muda
-- é só por onde a imagem entra e onde ela aparece.
-- =====================================================================

-- De qual turma é a foto. Opcional: foto de saída de campo com várias
-- turmas não é de nenhuma em particular.
alter table evidencia
  add column if not exists turma_id bigint references turma(id) on delete set null;

comment on column evidencia.turma_id is
  'A turma retratada, quando a foto é de uma turma. Nunca aluno: a foto é registro coletivo.';

-- Uma capa por escola. Trocar a capa é apagar a anterior e enviar outra;
-- duas capas ativas deixariam a view escolher uma ao acaso, e a escola
-- veria na página pública uma foto diferente da que escolheu.
create unique index if not exists evidencia_uma_capa_por_escola
  on evidencia (escola_id)
  where tipo = 'capa_escola' and status <> 'removida';

-- ---------------------------------------------------------------------
-- A capa na página pública
-- ---------------------------------------------------------------------

-- A coluna entra no fim, como `tipo` entrou: `create or replace view`
-- não aceita coluna no meio.
--
-- A capa só sai com a escola publicada (o `where` da view), com o termo
-- de imagem confirmado e com a foto em status publicada. Um pedido de
-- remoção despublica a foto por gatilho, e com isso a capa some daqui no
-- mesmo instante — sem ninguém precisar lembrar de limpar um ponteiro.
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
         limit 1) as capa_path
from escola e
join municipio m on m.id = e.municipio_id
where e.publicada = true
  and e.geom is not null;

-- ---------------------------------------------------------------------
-- A galeria conhece os tipos novos
-- ---------------------------------------------------------------------

-- `tipo` vai junto para a página separar "a turma" de "as saídas de
-- campo". Ficha digitalizada e documento continuam de fora: são papel
-- de trabalho, com letra e às vezes nome de estudante.
create or replace view pub_galeria with (security_invoker = off) as
select ev.id,
       ev.storage_path,
       ev.legenda,
       ev.publicada_em,
       e.slug as escola_slug,
       x.numero as expedicao_numero,
       ev.tipo::text as tipo
from evidencia ev
join escola e on e.id = ev.escola_id and e.publicada = true and e.termos_ok = true
left join expedicao x on x.id = ev.expedicao_id
where ev.status = 'publicada'
  and ev.tipo in ('foto_campo', 'foto_quadrat', 'capa_escola', 'foto_turma');

comment on view pub_galeria is
  'Servir com cabecalho noindex. Foto de turma nao deve aparecer em busca de imagens.';

grant select on pub_escola, pub_galeria to anon, authenticated;
