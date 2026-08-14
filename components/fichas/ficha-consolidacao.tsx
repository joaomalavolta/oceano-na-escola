import { Cabecalho, Caixa, Campo, Nota, Pauta, Titulo } from "./pecas";
import { comporFicha, serie } from "@/lib/fichas";
import type { DefinicaoProtocolo } from "@/lib/transcricao";

interface Props {
  definicao: DefinicaoProtocolo;
  equipes: number;
}

/**
 * A ficha do professor — uma por expedição.
 *
 * Ela existe porque o que se digita na plataforma não é a soma das
 * fichas das equipes: é o cabeçalho da expedição, que ninguém anota
 * porque "todo mundo sabe". Maré, chuva nas últimas 24 h, hora de
 * início. Três meses depois, quando os números de duas coletas não
 * batem, é exatamente isso que explica a diferença — e não está em
 * lugar nenhum.
 *
 * Por isso ela vem impressa antes das fichas das equipes, e por isso
 * termina numa conferência: o professor a preenche na praia, com o
 * celular no bolso, e a usa na mesa como roteiro de transcrição.
 */
export function FichaConsolidacao({ definicao, equipes }: Props) {
  const c = comporFicha(definicao);

  return (
    <article className="ficha-folha text-black">
      <Cabecalho
        titulo="Ficha do professor · consolidação"
        protocolo={`${definicao.codigo} — ${definicao.nome}`}
        versao={definicao.versao}
        direita={
          <div className="text-right shrink-0 text-[8pt]">
            <div className="uppercase tracking-wide">Expedição nº</div>
            <div className="border-2 border-black w-[90px] h-[34px]" />
            <div className="mt-0.5 text-[7.5pt]">preenchido na plataforma</div>
          </div>
        }
      />

      {/* ── 1. Cabeçalho da expedição ─────────────────── */}
      <section className="mb-3">
        <Titulo numero={1}>Cabeçalho da expedição</Titulo>
        <div className="flex gap-3">
          <Campo rotulo="Escola" />
          <Campo rotulo="Turma(s)" largura="w-[160px]" />
          <Campo rotulo="Data da saída" largura="w-[100px]" />
        </div>
        <div className="flex gap-3 mt-1.5">
          <Campo rotulo="Professor responsável" />
          <Campo rotulo="Hora de início" largura="w-[95px]" />
          <Campo rotulo="Hora de término" largura="w-[95px]" />
        </div>
        <div className="flex gap-3 mt-1.5">
          <Campo rotulo="Praia ou área" />
          <Campo rotulo="Nº de mapeadores" largura="w-[110px]" />
          <Campo rotulo="Nº de equipes" largura="w-[100px]" />
        </div>
        <div className="flex gap-3 mt-1.5">
          <Campo rotulo="Coordenada do ponto inicial" />
          <Campo rotulo="Coordenada do ponto final" />
          <Campo rotulo="Extensão percorrida" unidade="m" largura="w-[110px]" />
        </div>
      </section>

      {/* ── 2. Condições ──────────────────────────────── */}
      <section className="mb-3">
        <Titulo numero={2}>Condições no dia</Titulo>
        <Nota>
          Maré e chuva recente explicam variação entre duas coletas na mesma praia. Sem elas, uma
          queda de 40% nos números parece melhora quando foi só a maré.
        </Nota>
        <div className="mt-2 space-y-1.5 text-[9pt]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[8pt] uppercase tracking-wide w-[74px]">Maré</span>
            <Caixa rotulo="Enchente" />
            <Caixa rotulo="Vazante" />
            <Caixa rotulo="Preamar" />
            <Caixa rotulo="Baixamar" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[8pt] uppercase tracking-wide w-[74px]">Chuva 24 h</span>
            <Caixa rotulo="Sim" />
            <Caixa rotulo="Não" />
            <Caixa rotulo="Não sei" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[8pt] uppercase tracking-wide w-[74px]">Vento</span>
            <Caixa rotulo="Calmo" />
            <Caixa rotulo="Moderado" />
            <Caixa rotulo="Forte" />
          </div>
        </div>
      </section>

      {/* ── 3. Equipes ────────────────────────────────── */}
      <section className="mb-3 break-inside-avoid">
        <Titulo numero={3}>Equipes em campo</Titulo>
        <table className="w-full border-collapse text-[8.5pt]">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 w-[52px] text-[8pt]">Equipe</th>
              <th className="border border-black px-1 py-1 text-[8pt]">Quem estava</th>
              <th className="border border-black px-1 py-1 w-[100px] text-[8pt] leading-tight">
                {c.quadrat ? "Nº de quadrats" : "Trecho (m)"}
              </th>
              <th className="border border-black px-1 py-1 w-[86px] text-[8pt] leading-tight">
                Total contado
              </th>
              <th className="border border-black px-1 py-1 w-[72px] text-[8pt] leading-tight">
                Ficha recebida
              </th>
              <th className="border border-black px-1 py-1 w-[72px] text-[8pt] leading-tight">
                Transcrita
              </th>
            </tr>
          </thead>
          <tbody>
            {serie(equipes).map((n) => (
              <tr key={n}>
                <td className="border border-black px-1 py-[7px] text-center font-bold">{n}</td>
                <td className="border border-black px-1 py-[7px]" />
                <td className="border border-black px-1 py-[7px]" />
                <td className="border border-black px-1 py-[7px]" />
                <td className="border border-black px-1 py-[7px] text-center">
                  <span className="inline-block w-[11px] h-[11px] border border-black" />
                </td>
                <td className="border border-black px-1 py-[7px] text-center">
                  <span className="inline-block w-[11px] h-[11px] border border-black" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── 4. Conferência das ocorrências ────────────── */}
      <section className="mb-3 break-inside-avoid">
        <Titulo numero={4}>Ocorrências e fotos — conferência</Titulo>
        <Nota>
          Copie aqui, da ficha de cada equipe, o código de toda ocorrência registrada. Depois abra
          a galeria da expedição e confira se existe foto para cada código. Código sem foto vira
          ocorrência sem evidência; foto sem código não sabe a que linha voltar.
        </Nota>
        <table className="w-full border-collapse mt-2 text-[8.5pt]">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 w-[58px] text-[8pt]">Código</th>
              <th className="border border-black px-1 py-1 text-[8pt]">O que é</th>
              <th className="border border-black px-1 py-1 w-[58px] text-[8pt] leading-tight">
                Foto no app
              </th>
              <th className="border border-black px-1 py-1 w-[58px] text-[8pt] leading-tight">
                GPS ok
              </th>
              <th className="border border-black px-1 py-1 w-[62px] text-[8pt] leading-tight">
                Transcrita
              </th>
            </tr>
          </thead>
          <tbody>
            {serie(10).map((n) => (
              <tr key={n}>
                <td className="border border-black px-1 py-[7px]" />
                <td className="border border-black px-1 py-[7px]" />
                {[0, 1, 2].map((i) => (
                  <td key={i} className="border border-black px-1 py-[7px] text-center">
                    <span className="inline-block w-[11px] h-[11px] border border-black" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── 5. Antes de transcrever ───────────────────── */}
      <section className="break-inside-avoid">
        <Titulo numero={5}>Antes de transcrever na plataforma</Titulo>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9pt]">
          <Caixa rotulo="Recebi a ficha de todas as equipes" />
          <Caixa rotulo="Toda ficha tem o esforço amostral preenchido" />
          <Caixa rotulo="Todo código de ocorrência tem foto no aplicativo" />
          <Caixa rotulo="A fila de envio do celular está zerada" />
          <Caixa rotulo="Nenhuma foto tem rosto de aluno" />
          <Caixa rotulo="Anotei maré, chuva e vento" />
        </div>
        <div className="mt-2">
          <div className="text-[8.5pt] font-semibold">
            Observações gerais da expedição — o que os números não contam
          </div>
          <Pauta linhas={3} />
        </div>
      </section>

      <footer className="mt-3 pt-1.5 border-t border-black text-[8pt] flex justify-between">
        <span>Guarde esta folha até a expedição estar publicada no mapa.</span>
        <span>Consolidação · {definicao.codigo}</span>
      </footer>
    </article>
  );
}
