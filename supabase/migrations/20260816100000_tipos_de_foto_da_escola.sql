-- =====================================================================
-- Oceano na Escola — dois tipos novos de foto
--
-- Até aqui a única porta de entrada de uma imagem era o registro de
-- ocorrência em campo. A escola não tinha como mostrar a própria cara,
-- nem a turma que faz o trabalho.
--
--   capa_escola — a foto que representa a escola: a fachada, o portão,
--                 a turma reunida. Uma por escola.
--   foto_turma  — registro coletivo da turma, fora de uma saída de campo.
--
-- Este arquivo só acrescenta os valores ao enum, e é separado do
-- seguinte de propósito: o Postgres não deixa usar um valor de enum na
-- mesma transação em que ele foi criado, e a view e o índice que
-- dependem destes valores vêm logo depois.
-- =====================================================================

alter type tipo_evidencia add value if not exists 'capa_escola';
alter type tipo_evidencia add value if not exists 'foto_turma';
