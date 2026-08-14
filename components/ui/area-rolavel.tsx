"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Altura máxima em classe Tailwind, porque ela muda com o lugar. */
  className?: string;
}

/**
 * Área que rola sem parecer uma janela do sistema operacional.
 *
 * Duas coisas ao mesmo tempo, e uma não substitui a outra:
 *
 * A **barra fina** (`rolagem-suave`) resolve o peso visual. A barra
 * padrão é uma calha cinza encostada na borda, e sobre um painel de
 * vidro translúcido ela vira o elemento mais pesado da tela.
 *
 * O **desvanecer embaixo** resolve o que a barra fina perde ao ficar
 * discreta: o aviso de que há mais conteúdo. Um corte reto no meio de
 * uma linha parece defeito; o mesmo corte em degradê lê-se como
 * "continua".
 *
 * E ele só aparece quando há de fato o que rolar, e some ao chegar ao
 * fim. Aplicado sempre, apagaria o último item de uma lista curta — o
 * usuário veria um filtro meio sumido e concluiria que a tela está
 * quebrada.
 */
export function AreaRolavel({ children, className = "" }: Props) {
  const [temMais, setTemMais] = useState(false);
  const observador = useRef<ResizeObserver | null>(null);

  const medir = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    // A sobra de 2 px absorve a fração de pixel que aparece em tela com
    // zoom do navegador: sem ela, "chegou ao fim" nunca ficava
    // verdadeiro em 110%, e o degradê não sumia nunca.
    const sobra = el.scrollHeight - el.clientHeight - el.scrollTop;
    setTemMais(sobra > 2);
  }, []);

  /* Callback ref em vez de effect: o conteúdo do painel chega depois
     dos dados do mapa, e a altura muda quando o professor liga uma
     camada. O ResizeObserver acompanha as duas coisas sem que a medida
     precise virar um efeito que roda a cada render. */
  const referencia = useCallback(
    (el: HTMLDivElement | null) => {
      observador.current?.disconnect();
      if (!el) {
        observador.current = null;
        return;
      }
      medir(el);
      const ro = new ResizeObserver(() => medir(el));
      ro.observe(el);
      for (const filho of Array.from(el.children)) ro.observe(filho);
      observador.current = ro;
    },
    [medir]
  );

  return (
    <div
      ref={referencia}
      onScroll={(e) => medir(e.currentTarget)}
      className={`overflow-y-auto rolagem-suave ${temMais ? "desvanece-embaixo" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
