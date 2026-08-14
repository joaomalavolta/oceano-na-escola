import type { Metadata } from "next";
import Link from "next/link";
import {
  Map as MapIcon,
  Search,
  Activity,
  Share2,
  Sprout,
  ShieldCheck,
  Users,
  ArrowRight,
  Info,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";

export const metadata: Metadata = {
  title: "Sobre o projeto — Oceano na Escola",
  description:
    "Plataforma de Cultura Oceânica, ciência cidadã e monitoramento ambiental costeiro organizada a partir de escolas. Instituto Ecosurf, Itanhaém/SP.",
};

/**
 * A página institucional.
 *
 * O conteúdo sai do documento de premissas, que é a decisão do projeto —
 * inclusive as partes que uma página institucional normalmente maquia: o
 * que a plataforma não faz, o que ela protege e por quê, e o fato de que
 * hoje tudo o que está no mapa é fictício. Uma escola decide participar
 * lendo isto, e uma família decide autorizar a filha lendo isto. Vender
 * mais do que existe seria caro para as duas.
 */

const VERBOS = [
  { icone: MapIcon, verbo: "Mapear", texto: "Onde estão os problemas e as riquezas do território costeiro." },
  { icone: Search, verbo: "Investigar", texto: "Por que estão ali, e o que os mantém." },
  { icone: Activity, verbo: "Monitorar", texto: "Se mudam com o tempo — e a série só existe se a escola voltar." },
  { icone: Share2, verbo: "Compartilhar", texto: "Com a comunidade, a rede de escolas e o poder público." },
  { icone: Sprout, verbo: "Agir", texto: "Transformar leitura de território em intervenção." },
];

const CICLO = [
  {
    n: "1",
    titulo: "A escola adota um trecho",
    texto:
      "Praia, restinga, foz, manguezal ou costão. A turma volta ao mesmo lugar, que é o que transforma uma visita em série histórica.",
  },
  {
    n: "2",
    titulo: "A saída de campo",
    texto:
      "Contagem por área — resíduos e microplásticos — usa ficha impressa, porque contagem sem esforço amostral registrado não vira densidade. Ocorrência pontual — entulho, esgoto, supressão de restinga, encalhe — nasce no celular, com GPS e foto, no ponto em que o estudante está.",
  },
  {
    n: "3",
    titulo: "De volta à sala",
    texto:
      "A turma transcreve as fichas e trabalha sobre o que mapeou. O dado passa por rascunho, enviado, revisado e validado antes de existir para o público.",
  },
  {
    n: "4",
    titulo: "O mapa da rede",
    texto:
      "Publicado, o dado entra no mapa coletivo e nos indicadores abertos, ao lado do das outras escolas. O território deixa de ser o pátio de uma escola e vira litoral monitorado.",
  },
];

const PAPEIS = [
  ["Professor", "Cadastra a escola e a turma, cria expedições, registra em campo, transcreve, cura a galeria e publica."],
  ["Coordenação escolar", "Acompanha as turmas da escola e faz curadoria das imagens."],
  ["Coordenação municipal", "Acompanha várias escolas do município."],
  ["Pesquisador", "Consulta e exporta os dados da rede."],
  ["Instituto Ecosurf", "Gestão da rede e validação técnica junto ao professor."],
];

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      <main className="flex-1 w-full">
        {/* Abertura */}
        <section className="bg-marca text-white">
          <div className="max-w-4xl mx-auto px-4 py-14 md:py-20">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-4">
              Instituto Ecosurf · Itanhaém, São Paulo
            </p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              O litoral monitorado por quem mora nele.
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/85 leading-relaxed max-w-2xl">
              Oceano na Escola é uma plataforma de Cultura Oceânica, ciência cidadã e
              monitoramento ambiental organizada a partir de escolas. A escola atua como
              núcleo local, os estudantes como mapeadores, e o mapa coletivo como
              instrumento de leitura e transformação do território.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 space-y-14">
          {/* Cinco verbos */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2 mb-5">
              Cinco verbos organizam o trabalho
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              São o escopo do projeto, e também o seu limite: funcionalidade que não couber em
              pelo menos um deles fica de fora da plataforma.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {VERBOS.map(({ icone: Icone, verbo, texto }) => (
                <div key={verbo} className="bg-card border border-border rounded-md p-4 shadow-2xs">
                  <Icone className="w-5 h-5 text-primary mb-2" />
                  <h3 className="text-sm font-bold">{verbo}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{texto}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Como funciona */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2 mb-5">
              Como funciona
            </h2>
            <ol className="space-y-4">
              {CICLO.map(({ n, titulo, texto }) => (
                <li key={n} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold tabular-nums">
                    {n}
                  </span>
                  <div className="min-w-0 pt-1">
                    <h3 className="text-sm font-bold">{titulo}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Proteção — a seção que decide se uma escola confia */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2 mb-5">
              O que é público, o que é protegido
            </h2>
            <div className="bg-card border border-border rounded-md p-5 space-y-4 shadow-2xs">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-3 text-xs leading-relaxed">
                  <p>
                    <strong className="text-sm block mb-1">Não existe conta de aluno.</strong>
                    As contas são de escola, turma e classe. Quem está autenticado no aparelho é
                    sempre o professor, mesmo quando o celular é do estudante. Nome de estudante
                    não aparece em página pública, e as fotos são registro coletivo da turma.
                  </p>
                  <p>
                    <strong className="text-sm block mb-1">
                      A coordenada segue duas regras, não uma.
                    </strong>
                    Onde a turma percorreu o trecho aparece somado em células de 100 metros, e a
                    célula só é publicada a partir de três unidades amostrais: essa coordenada diz
                    onde as crianças estiveram, e continua protegida. Já a ocorrência ambiental —
                    o ponto de esgoto, o entulho, a supressão de restinga — aparece no lugar exato
                    em que está, porque descreve o território e não a turma. Um problema ambiental
                    que não se pode apontar não se pode cobrar.
                  </p>
                  <p>
                    <strong className="text-sm block mb-1">Toda foto passa por três portas.</strong>
                    Curadoria do professor, escola publicada e termo de uso de imagem confirmado.
                    Faltando uma, a imagem não aparece. A galeria e as fotos de ocorrência ficam
                    fora dos buscadores, e famílias podem pedir a remoção de uma imagem sem
                    precisar de conta.
                  </p>
                  <p className="text-muted-foreground">
                    O Instituto Ecosurf é o controlador dos dados. Cada escola participante assina
                    termo de parceria, termo de responsabilidade sobre os alunos e termo de uso de
                    imagem.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Papéis */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2 mb-5">
              Quem faz o quê
            </h2>
            <div className="bg-card border border-border rounded-md divide-y divide-border shadow-2xs">
              {PAPEIS.map(([papel, faz]) => (
                <div key={papel} className="flex gap-3 p-4">
                  <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{papel}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{faz}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Fase atual — dito alto, não escondido */}
          <section>
            <div className="flex gap-3 p-5 rounded-md border-2 border-marca-forte/40 bg-marca-forte/5">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-2">
                <h2 className="text-sm font-bold text-foreground">
                  Nesta fase, tudo o que está no mapa é fictício
                </h2>
                <p>
                  As quatro escolas, os territórios, as expedições, as fichas preenchidas, as
                  ocorrências, o diário de campo e as histórias são demonstração. Nenhuma escola,
                  nenhum estudante e nenhum dado real estão publicados aqui — inclusive os nomes de
                  praia são inventados, porque nomear o trecho que uma turma monitora ajuda a
                  identificar a turma.
                </p>
                <p className="text-muted-foreground">
                  O que a demonstração mostra é o ciclo completo funcionando, de ponta a ponta, para
                  que escolas e parceiros vejam o que estão aceitando antes de haver criança em
                  campo.
                </p>
              </div>
            </div>
          </section>

          {/* Saídas */}
          <section className="grid sm:grid-cols-3 gap-3">
            {[
              { href: "/", titulo: "Ver o mapa", texto: "O território como está hoje" },
              { href: "/escolas", titulo: "As escolas da rede", texto: "Quem monitora o quê" },
              { href: "/dados", titulo: "Dados abertos", texto: "Indicadores por município" },
            ].map(({ href, titulo, texto }) => (
              <Link
                key={href}
                href={href}
                className="group bg-card border border-border rounded-md p-4 shadow-2xs hover:border-primary transition-colors"
              >
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  {titulo}
                  <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{texto}</p>
              </Link>
            ))}
          </section>

          <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
            <p>
              Oceano na Escola é um projeto do{" "}
              <strong className="text-foreground">Instituto Ecosurf</strong>. Escola interessada em
              participar fala com o instituto — a entrada na rede passa por termo de parceria, e não
              por cadastro avulso.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
