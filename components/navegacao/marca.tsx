"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Waves } from "lucide-react";

/**
 * A marca no topo: logo do Instituto Ecosurf e o nome da plataforma.
 *
 * É um bloqueio de marca de dois níveis — a instituição responde pela
 * plataforma, e a plataforma tem nome próprio. O traço vertical separa
 * os dois em vez de empilhá-los: "Ecosurf Oceano na Escola" lido de
 * corrido soa como um nome só, que nenhum dos dois é.
 *
 * O arquivo da logo pode chegar em SVG ou PNG, e a marca tenta os dois
 * antes de desistir: quem for colocar o arquivo não deveria precisar
 * converter formato para o header funcionar. Sem nenhum deles, entra a
 * onda que já estava aqui e a barra continua inteira, em vez de exibir
 * imagem quebrada.
 *
 * Duas versões de arte, uma para cada fundo. Com as duas presentes, cada
 * uma serve o seu e as cores da marca ficam preservadas. Com uma só, ela
 * serve os dois: o filtro rebate a arte em preto ou em branco e a
 * transparência é respeitada. Fica monocromático — perde a cor da marca
 * — mas é legível, que é o que o header precisa, e vale nos dois
 * sentidos: só a versão escura, ou só a clara.
 *
 * A clara sozinha é o caso comum, porque logo institucional costuma ser
 * distribuída em branco vazado para aplicar sobre foto. Antes, com só
 * ela na pasta, o header caía na onda genérica — o arquivo certo estava
 * lá e não aparecia.
 */

const LOGO = ["/logo-ecosurf.svg", "/logo-ecosurf.png"];
const LOGO_CLARA = ["/logo-ecosurf-clara.svg", "/logo-ecosurf-clara.png"];

interface ImagemProps {
  fontes: string[];
  alt: string;
  className: string;
  onEsgotar: () => void;
}

/** Tenta cada fonte em ordem; avisa quando todas falharem. */
function ImagemComAlternativas({ fontes, alt, className, onEsgotar }: ImagemProps) {
  const [indice, setIndice] = useState(0);
  const ref = useRef<HTMLImageElement>(null);

  const falhou = useCallback(() => {
    if (indice + 1 < fontes.length) setIndice(indice + 1);
    else onEsgotar();
  }, [indice, fontes.length, onEsgotar]);

  /**
   * Recupera a falha que aconteceu antes da página ser hidratada.
   *
   * A imagem começa a carregar enquanto o HTML ainda está sendo lido, e
   * o `onError` do JSX só passa a existir quando o React assume a
   * página. Nesse intervalo o erro acontece, dispara e se perde: o
   * componente ficava parado na primeira fonte para sempre, e a cadeia
   * de alternativas nunca era percorrida — nem a onda de reserva
   * aparecia, porque `onEsgotar` também dependia do evento.
   *
   * Imagem já resolvida com largura natural zero é imagem que falhou. É
   * o que dá para perguntar depois do fato.
   */
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) falhou();
  }, [falhou]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={fontes[indice]}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      onError={falhou}
      className={className}
    />
  );
}

interface MarcaProps {
  /** Compacta a marca, para a barra flutuante sobre o mapa. */
  compacta?: boolean;
  /**
   * A marca está sobre a faixa azul institucional.
   *
   * Aí não é o tema que decide qual arte usar: o fundo é escuro nos
   * dois temas, então a versão clara é a natural e vai sem filtro
   * nenhum — é a única situação em que a logo aparece exatamente como
   * foi desenhada, em vez de rebatida.
   */
  sobreEscuro?: boolean;
}

export function Marca({ compacta = false, sobreEscuro = false }: MarcaProps) {
  const [semEscura, setSemEscura] = useState(false);
  const [semClara, setSemClara] = useState(false);

  // Estáveis de propósito: a verificação pós-hidratação lá dentro
  // depende delas, e um callback novo a cada render faria a checagem
  // rodar a cada render, para sempre.
  const marcarSemEscura = useCallback(() => setSemEscura(true), []);
  const marcarSemClara = useCallback(() => setSemClara(true), []);

  const altura = compacta ? "h-6" : "h-7";
  const base = `${altura} w-auto shrink-0`;
  const semNenhuma = semEscura && semClara;

  // Qual das duas artes de fato aparece — precisa ser decidido em JS
  // porque é ela que carrega o texto alternativo; a outra é decorativa.
  // Fora da faixa azul, quem serve o tema claro é a escura, e o tema é
  // coisa do CSS: por isso ali a escura leva, mesmo que o visitante
  // esteja no escuro vendo a clara.
  const escuraLeva = semClara || (!sobreEscuro && !semEscura);

  const classeEscura = semEscura
    ? "hidden"
    : sobreEscuro
      ? // Sobre o azul só entra se não houver arte clara — e aí é
        // rebatida em branco, que é o que o fundo exige.
        semClara
        ? `${base} brightness-0 invert`
        : "hidden"
      : `${base} ${semClara ? "dark:brightness-0 dark:invert" : "dark:hidden"}`;

  const classeClara = semClara
    ? "hidden"
    : sobreEscuro
      ? base
      : semEscura
        ? `${base} brightness-0 dark:brightness-100`
        : `${base} hidden dark:block`;

  // As duas imagens ficam montadas mesmo quando não aparecem. Desmontar
  // uma para mostrar a outra abortaria a tentativa dela no meio: é o
  // próprio `onError` que descobre qual arte existe, e uma imagem
  // desmontada nunca termina de responder.
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 min-w-0"
      aria-label="Oceano na Escola — Instituto Ecosurf"
    >
      {semNenhuma && (
        <span
          className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${
            sobreEscuro ? "bg-white/15 text-white" : "bg-primary text-primary-foreground"
          }`}
        >
          <Waves className="w-4 h-4" />
        </span>
      )}

      <ImagemComAlternativas
        fontes={LOGO}
        alt={escuraLeva ? "Instituto Ecosurf" : ""}
        onEsgotar={marcarSemEscura}
        className={classeEscura}
      />

      <ImagemComAlternativas
        fontes={LOGO_CLARA}
        alt={escuraLeva ? "" : "Instituto Ecosurf"}
        onEsgotar={marcarSemClara}
        className={classeClara}
      />

      {/* O traço só aparece com a logo: sem ela, separaria a onda do
          nome sem motivo. */}
      {!semNenhuma && (
        <span
          className={`w-px h-6 shrink-0 ${sobreEscuro ? "bg-white/30" : "bg-border"}`}
          aria-hidden="true"
        />
      )}

      <span
        className={`font-semibold tracking-tight truncate ${
          sobreEscuro ? "text-white" : "text-foreground"
        } ${compacta ? "text-sm" : "text-sm md:text-[15px]"}`}
      >
        Oceano na Escola
      </span>
    </Link>
  );
}
