import {
  Map,
  School,
  Database,
  BarChart3,
  Compass,
  BookText,
  Image as ImageIcon,
  Info,
  ShieldCheck,
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
  /** Só para a administração do Ecosurf. Vem por último de todos. */
  soAdmin?: boolean;
}

export const ITENS_NAV: ItemNav[] = [
  { href: "/", label: "Mapa", icon: Map },
  { href: "/escolas", label: "Escolas", icon: School },
  { href: "/dados", label: "Dados", icon: Database },
  { href: "/sobre", label: "Sobre", icon: Info },
  { href: "/painel", label: "Painel", icon: BarChart3, privado: true },
  { href: "/expedicoes", label: "Expedições", icon: Compass, privado: true },
  { href: "/historias", label: "Histórias", icon: BookText, privado: true },
  { href: "/galeria", label: "Galeria", icon: ImageIcon, privado: true },
  // Última da fila pela mesma razão que os privados vêm depois dos
  // públicos: item que aparece quando o papel carrega não empurra os
  // vizinhos se entrar no fim. E a fila de cadastros à espera só é
  // trabalho de quem pode aprová-los — para o professor, "Administração"
  // no menu seria uma porta que abre numa sala vazia.
  { href: "/admin", label: "Administração", icon: ShieldCheck, privado: true, soAdmin: true },
];

export function itensPara(autenticado: boolean, admin = false): ItemNav[] {
  return ITENS_NAV.filter(
    (i) => (autenticado || !i.privado) && (admin || !i.soAdmin)
  );
}

/**
 * Quem entra na barra do polegar, no celular. Só cabem quatro.
 *
 * É seleção, e não os quatro primeiros da lista: pegando o começo, o
 * professor recebia "Dados" — página pública de indicadores — no lugar
 * de "Expedições", que é onde ele trabalha. A regra de ordem única
 * tinha caído justamente no espaço mais escasso da interface.
 *
 * A ordem, porém, continua vindo de `ITENS_NAV`: isto aqui diz quem
 * entra, nunca em que sequência. Um `filter` preserva a ordem da lista,
 * então a barra do polegar é sempre uma subsequência do menu do
 * desktop — a mão aprende um lugar só.
 */
const POLEGAR_VISITANTE = ["/", "/escolas", "/dados"];
const POLEGAR_AUTENTICADO = ["/", "/escolas", "/painel", "/expedicoes"];

export function itensDoPolegar(autenticado: boolean): ItemNav[] {
  const escolhidos = new Set(autenticado ? POLEGAR_AUTENTICADO : POLEGAR_VISITANTE);
  // Sem `admin`: os quatro do polegar são escolha fixa, e "Administração"
  // não está entre eles. Passar o papel aqui só criaria a chance de a
  // barra do celular deixar de ser subsequência do menu do desktop.
  return itensPara(autenticado).filter((i) => escolhidos.has(i.href));
}

/**
 * Ativo por prefixo: /expedicoes/5/revisar acende "Expedições". A raiz
 * só por igualdade, senão acenderia em toda página.
 */
export function estaAtivo(href: string, caminho: string): boolean {
  if (href === "/") return caminho === "/";
  return caminho === href || caminho.startsWith(href + "/");
}
