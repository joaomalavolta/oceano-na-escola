import type { Metadata } from "next";
import { ShieldCheck, Clock, Check } from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { Voltar, VoltarRodape } from "@/components/navegacao/voltar";
import { IconeBadge, COR_GUARDIAO } from "@/components/mapa/icones";
import { EscolasDeSurf } from "@/components/guardioes/escolas-de-surf";
import { BotaoCadastroSurf } from "@/components/guardioes/botao-cadastro-surf";
import { FRENTES, PASSOS, ROTULO_DA_SITUACAO } from "@/lib/guardioes";

export const metadata: Metadata = {
  title: "Guardiões Ecosurf — Oceano na Escola",
  description:
    "O programa Oceano na Escola para escolas de surf: o mesmo método de monitoramento costeiro, aplicado por quem está na praia quase todo dia. Instituto Ecosurf.",
};

/**
 * A página pública do programa Guardiões Ecosurf.
 *
 * Não está no menu de cima: chega-se a ela pela aba "Escolas de surf"
 * de /escolas e pela página Sobre. O menu é o mesmo para os dois tipos
 * de escola, e um item a mais ali diria que são duas plataformas.
 *
 * O texto segue a regra da página Sobre: dizer o que existe. As frentes
 * sem método definido aparecem marcadas como tal, e o registro rápido
 * de sessão — que tem função no banco e ainda não tem tela — aparece
 * como "em preparação", e não entre os passos.
 */
export default function GuardioesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      <main className="flex-1 w-full">
        <section className="bg-marca text-white">
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-4">
              Programa Oceano na Escola · Instituto Ecosurf
            </p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] flex items-center gap-3">
              <IconeBadge slug="escola_surf" cor={COR_GUARDIAO} tamanho={44} className="ring-2 ring-white" />
              Guardiões Ecosurf
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/85 leading-relaxed max-w-2xl">
              As escolas de surf entram na rede com o mesmo método e a mesma plataforma das
              escolas. Quem dá aula na praia volta ao mesmo trecho de areia semana após semana —
              e é essa volta que transforma observação em série histórica.
            </p>
            <div className="mt-7">
              <BotaoCadastroSurf />
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-12">
          <Voltar para="escolas" />

          {/* Frentes */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2 mb-5">
              O que os Guardiões observam
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              Os protocolos são os mesmos das escolas, para que o dado de uma escola de surf some
              com o de uma turma de 7º ano no mesmo mapa. Duas frentes ainda não têm método
              definido, e estão marcadas.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {FRENTES.map((f) => {
                const pronta = f.situacao === "disponivel";
                return (
                  <div
                    key={f.id}
                    className={`bg-card border rounded-md p-4 shadow-2xs ${
                      pronta ? "border-border" : "border-dashed border-border"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <IconeBadge
                        slug={f.icone}
                        cor="var(--color-primary)"
                        tamanho={28}
                        className={pronta ? "" : "opacity-40 saturate-0"}
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold">{f.titulo}</h3>
                        <p
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
                            pronta ? "text-emerald-600" : "text-muted-foreground"
                          }`}
                        >
                          {pronta ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {ROTULO_DA_SITUACAO[f.situacao]}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{f.texto}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Passos */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2 mb-5">
              Como funciona
            </h2>
            <ol className="space-y-4">
              {PASSOS.map(({ n, titulo, texto }) => (
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

            <div className="mt-6 flex gap-3 border border-dashed border-border rounded-md p-4">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Em preparação: registro rápido.</strong> Hoje o
                registro é organizado por expedição, como nas escolas. Está em preparação um
                registro mais curto, para o instrutor marcar uma ocorrência no meio da rotina de
                aula sem montar uma expedição inteira.
              </p>
            </div>
          </section>

          {/* Proteção */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2 mb-5">
              As mesmas regras de proteção
            </h2>
            <div className="bg-card border border-border rounded-md p-5 shadow-2xs flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-3 text-xs leading-relaxed">
                <p>
                  <strong className="text-sm block mb-1">Não existe conta de aluno.</strong>
                  A conta é do instrutor responsável. Nome de aluno não aparece em página pública.
                </p>
                <p>
                  <strong className="text-sm block mb-1">Toda foto passa por três portas.</strong>
                  Curadoria do instrutor, escola de surf publicada e termo de uso de imagem
                  confirmado. Faltando uma, a imagem não aparece — e qualquer pessoa pode pedir a
                  remoção de uma imagem sem precisar de conta.
                </p>
                <p>
                  <strong className="text-sm block mb-1">
                    A ocorrência aparece no lugar exato; as pessoas, não.
                  </strong>
                  O ponto de esgoto ou de descarte vai ao mapa na coordenada em que está, porque
                  descreve o território. Onde a turma esteve só aparece somado em células de 100
                  metros.
                </p>
              </div>
            </div>
          </section>

          {/* Participantes */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2 mb-5">
              Escolas de surf na rede
            </h2>
            <EscolasDeSurf />
          </section>

          {/* Chamada */}
          <section className="bg-card border border-border rounded-md p-6 shadow-2xs">
            <h2 className="text-base font-bold">A sua escola de surf pode participar</h2>
            <p className="text-sm text-muted-foreground mt-1.5 mb-4 max-w-2xl leading-relaxed">
              O cadastro é feito pelo instrutor responsável e passa por análise do Instituto
              Ecosurf. Enquanto a análise corre, a escola de surf já pode registrar em campo: os
              dados ficam guardados e entram no mapa quando o cadastro for aprovado.
            </p>
            <BotaoCadastroSurf />
          </section>

          <VoltarRodape para="escolas" />
        </div>
      </main>
    </div>
  );
}
