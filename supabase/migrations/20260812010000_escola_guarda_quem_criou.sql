-- =====================================================================
-- Oceano na Escola — a escola guarda quem a criou
--
-- Defeito encontrado ao testar o cadastro de escola pela ficha de saída
-- de campo: `insert ... returning` era recusado pelo RLS, embora o
-- insert sozinho passasse.
--
-- A razão é de ordem de execução. O vínculo entre quem cadastra e a
-- escola é criado por um gatilho AFTER INSERT, mas a cláusula RETURNING
-- avalia a policy de SELECT antes de o gatilho rodar. Naquele instante
-- app_tem_vinculo(id) ainda é falso, e o Postgres recusa devolver a
-- linha recém-criada — com a mensagem de violação de RLS, que parece
-- erro de permissão de escrita e não é.
--
-- Isso alcançava o cliente: cadastrarEscola() pede .select("id, slug")
-- justamente para saber o id da escola criada. Nenhuma escola havia
-- sido cadastrada pela interface até agora — as do piloto vieram de
-- migration, com service role, que ignora RLS —, então o defeito estava
-- escondido.
--
-- A correção não é tirar o RETURNING do cliente: é dar à escola o mesmo
-- `criado_por` que expedicao, evidencia, historia e diario_entrada já
-- têm. Quem criou enxerga o que criou, no mesmo instante, sem depender
-- de gatilho nenhum.
-- =====================================================================

alter table escola
  add column if not exists criado_por uuid references perfil(id) default auth.uid();

comment on column escola.criado_por is
  'Quem cadastrou. Preenchido por default, nunca pelo cliente: a coluna não é concedida em insert, para ninguém forjar autoria.';

-- Preenche o histórico com quem já tem vínculo, quando houver um só.
-- Escola de migration fica nula, e é o correto: ninguém a criou.
-- uuid não tem min(); com um vínculo só, o primeiro do array é ele.
update escola e
   set criado_por = v.perfil_id
  from (select escola_id, (array_agg(perfil_id))[1] as perfil_id
          from vinculo_escola
         group by escola_id
        having count(*) = 1) v
 where v.escola_id = e.id
   and e.criado_por is null;

-- A leitura passa a admitir a autoria. Sem isso, o RETURNING de um
-- insert continua caindo, porque o vínculo ainda não existe.
drop policy if exists escola_leitura on escola;
create policy escola_leitura on escola for select to authenticated
  using (app_tem_vinculo(id) or criado_por = auth.uid() or app_is_pesquisador());

-- A escrita segue exigindo vínculo: criar não é o mesmo que administrar
-- para sempre, e o vínculo é o que a coordenação municipal usa para
-- assumir uma escola.

-- ---------------------------------------------------------------------
-- Escola sem coordenada não vai para o mapa
-- ---------------------------------------------------------------------

-- Consequência de deixar a coordenada para depois: uma escola publicada
-- antes de ter posição entregaria lat e lng nulos, e o marcador do mapa
-- iria parar na origem — ou derrubaria o componente. A view passa a
-- exigir a geometria, e a escola aparece no mapa quando tiver as duas
-- coisas: posição e publicação.
create or replace view pub_escola with (security_invoker = off) as
select e.id,
       e.slug,
       e.nome,
       e.apresentacao,
       m.nome as municipio,
       m.uf,
       st_y(e.geom::geometry) as lat,
       st_x(e.geom::geometry) as lng
from escola e
join municipio m on m.id = e.municipio_id
where e.publicada = true
  and e.geom is not null;

grant select on pub_escola to anon, authenticated;
