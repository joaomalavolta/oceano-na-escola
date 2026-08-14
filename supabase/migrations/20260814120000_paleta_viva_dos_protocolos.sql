-- ---------------------------------------------------------------------
-- A paleta dos protocolos fica viva
-- ---------------------------------------------------------------------
--
-- A paleta anterior tinha croma médio 0,111 — contra cerca de 0,17 do
-- que se lê como cor viva. Mas o número que mais pesava era outro: os
-- sete protocolos viviam entre luminosidade 0,51 e 0,58, quase o mesmo
-- tom. Sete cores de mesmo peso viram uma massa só no mapa, e nenhuma
-- delas salta da imagem de satélite embaixo.
--
-- Esta é a proposta "campo aberto": sobe o croma para 0,153 E escalona
-- a luminosidade de 0,45 a 0,64. O segundo movimento é o que faz o olho
-- separar os protocolos sem ler a legenda — a distância perceptual
-- entre o par mais parecido sai de 0,091 para 0,163.
--
-- Duas restrições foram respeitadas, e valem para qualquer paleta futura
-- que substitua esta:
--
--   1. O glifo é branco em cima da cor, então toda cor precisa ser
--      escura o bastante para dar 3:1 com branco. A pior aqui é a de
--      qualidade da água, com 3,26:1.
--   2. As sete são um esquema CATEGÓRICO: existem para serem
--      distinguíveis entre si, não para harmonizar. É por isso que
--      resíduos não pode virar azul — colidiria com avifauna, que já é.
--
-- A rampa de densidade da grade acompanha o novo tom de resíduos, no
-- CSS: grade e pino do mesmo dado não podem ser de cores diferentes.

update protocolo set cor = '#00736d' where codigo = 'RES';  -- resíduos costeiros
update protocolo set cor = '#773ac1' where codigo = 'MIC';  -- microplásticos
update protocolo set cor = '#329929' where codigo = 'RST';  -- restinga
update protocolo set cor = '#b16600' where codigo = 'ESG';  -- esgoto e drenagem
update protocolo set cor = '#c51d28' where codigo = 'DES';  -- descarte irregular
update protocolo set cor = '#0051b0' where codigo = 'AVI';  -- avifauna
update protocolo set cor = '#009daf' where codigo = 'AGU';  -- qualidade da água
