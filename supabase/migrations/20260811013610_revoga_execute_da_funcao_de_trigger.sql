-- =====================================================================
-- Oceano na Escola — 20260811010000_revoga_execute_da_funcao_de_trigger.sql
--
-- vincula_criador_escola() e security definer e ficou chamavel por
-- anon e authenticated via /rest/v1/rpc/. Ela nunca deve ser chamada
-- pela API: existe para rodar no trigger de insercao de escola.
--
-- Por que aqui o revoke e seguro, e nas funcoes de RLS nao era
--
-- A expressao de uma policy e avaliada com os privilegios de quem
-- consulta, entao revogar execute das funcoes auxiliares tornava as
-- tabelas ilegiveis. Ja o privilegio de execute de uma funcao de
-- trigger e verificado no create trigger, nao a cada disparo — o
-- gatilho segue funcionando para quem nao pode chamar a funcao.
--
-- Verificado em PostgreSQL 16: depois do revoke, insercao de escola
-- por usuario autenticado continua criando o vinculo do criador.
-- =====================================================================

revoke execute on function vincula_criador_escola() from anon, authenticated, public;
