-- =====================================================================
-- Oceano na Escola — tipos de mídia do mural
--
-- Separado do arquivo seguinte pela mesma razão de antes: valor novo de
-- enum não pode ser usado na transação que o cria.
-- =====================================================================

alter type tipo_evidencia add value if not exists 'foto_mural';
alter type tipo_evidencia add value if not exists 'video_mural';
