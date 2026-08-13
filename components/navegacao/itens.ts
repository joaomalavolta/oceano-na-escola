import {
  Map,
  School,
  Database,
  BarChart3,
  Compass,
  BookText,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Os itens de navegação da plataforma, em uma lista só.
 *
 * Havia três: a barra das páginas, a barra sobre o mapa e a barra
 * inferior do celular, cada uma com o seu conjunto e a sua ordem.
 * "Escolas" era o segundo item numa e o sexto na outra, e "Dados"
 * existia só na primeira — e sumia quando o professor entrava. Ir do
 * mapa para qualquer página remontava o menu na frente de quem clicou.
 *
 * A ORDEM É A MESMA EM TODA PARTE, e não é acidental: primeiro o que
 * qualquer visitante alcança, depois o que exige conta. Assim, quando a
 * sessão termina de carregar e os itens privados aparecem, eles entram
 * no fim da fila — nenhum item que já estava na tela muda de lugar. Era
 * essa a piscada ao carregar a página.
 */
export interface ItemNav {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Só aparece com sessão. Vem depois dos públicos, sempre. */
  privado?: boolean;
}

export const ITENS_NAV: ItemNav[] = [
  { href: "/", label: "Mapa", icon: Map },
  { href: "/escolas", label: "Escolas", icon: School },
  { href: "/dados", label: "Dados", icon: Database },
  { href: "/painel", label: "Painel", icon: BarChart3, privado: true },
  { href: "/expedicoes", label: "Expedições", icon: Compass, privado: true },
  { href: "/historias", label: "Histórias", icon: BookText, privado: true },
  { href: "/galeria", label: "Galeria", icon: ImageIcon, privado: true },
];

export function itensPara(autenticado: boolean): ItemNav[] {
  return autenticado ? ITENS_NAV : ITENS_NAV.filter((i) => !i.privado);
}

/**
 * Ativo por prefixo: /expedicoes/5/revisar acende "Expedições". A raiz
 * só por igualdade, senão acenderia em toda página.
 */
export function estaAtivo(href: string, caminho: string): boolean {
  if (href === "/") return caminho === "/";
  return caminho === href || caminho.startsWith(href + "/");
}
