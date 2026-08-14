import { Fragment } from "react";
import { Cabecalho, Caixa, Campo, Nota, Pauta, Titulo } from "./pecas";
import {
  codigoOcorrencia,
  comporFicha,
  dividirEmColunas,
  linhasDeOcorrencia,
  serie,
  INSTRUCAO_DO_CODIGO,
  LINHAS_DE_QUADRAT,
} from "@/lib/fichas";
import type { DefinicaoProtocolo } from "@/lib/transcricao";

interface Props {
  definicao: DefinicaoProtocolo;
  equipe: number;
  ocorrencias?: number;
}

/**
 * A ficha que vai na prancheta da equipe.
 *
 * Uma folha por equipe, por unidade amostral. A ordem das seções é a
 * ordem do trabalho na praia, e não a ordem do banco de dados: primeiro
 * se mede o trecho, depois se conta, depois se registra o que fugiu da
 * contagem. A medida vem antes porque é a que todo mundo esquece, e
 * sem ela a contagem não vira densidade.
 */
export function FichaEquipe({ definicao, equipe, ocorrencias }: Props) {
  const c = comporFicha(definicao);
  const nLinhas = linhasDeOcorrencia(c, ocorrencias);

  return (
    <article className="ficha-folha text-black">
      <Cabecalho
        titulo="Ficha da equipe"
        protocolo={`${definicao.codigo} — ${definicao.nome}`}
        versao={definicao.versao}
        direita={
          <div className="text-right shrink-0">
            <div className="text-[8pt] uppercase tracking-wide">Equipe</div>
            <div className="text-[26pt] font-bold leading-none border-2 border-black px-3 py-0.5">
              {equipe}
            </div>
          </div>
        }
      />

      {/* ── Identificação ─────────────────────────────── */}
      <section className="mb-3">
        <div className="flex gap-3">
          <Campo rotulo="Escola" />
          <Campo rotulo="Turma" largura="w-[110px]" />
          <Campo rotulo="Data" largura="w-[90px]" />
        </div>
        <div className="flex gap-3 mt-1.5">
          <Campo rotulo="Praia ou área" />
          <Campo rotulo="Início (hora)" largura="w-[80px]" />
          <Campo rotulo="Fim (hora)" largura="w-[80px]" />
        </div>
        <div className="flex gap-3 mt-1.5">
          <Campo rotulo="Quem preencheu esta ficha" />
          <Campo rotulo="Nº de pessoas na equipe" largura="w-[130px]" />
        </div>
      </section>

      {/* ── 1. Esforço amostral ───────────────────────── */}
      {c.esforco && (
        <section className="mb-3">
          <Titulo numero={1}>{c.esforco.nome}</Titulo>
          <Nota>
            Preencha antes de contar qualquer coisa. Sem esta medida a contagem não vira densidade,
            e o dado da equipe não pode ser comparado com nenhum outro.
          </Nota>
          <div className="flex flex-wrap gap-3 mt-2">
            {c.esforco.campos.map((campo) => (
              <Campo
                key={campo.id}
                rotulo={campo.rotulo}
                unidade={campo.unidade}
                largura="w-[calc(33%-0.5rem)]"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 2. Contagem por item ──────────────────────── */}
      {c.grupos.length > 0 && (
        <section className="mb-3 break-inside-avoid">
          <Titulo numero={2}>Contagem</Titulo>
          <Nota>
            Um risquinho por item encontrado. No fim, some e escreva o total. Zero também é
            resultado: escreva 0, não deixe em branco.
          </Nota>
          {/* Duas colunas lado a lado. Em coluna única a ficha de
              resíduos passava de uma folha e meia, e a equipe ficava
              virando papel na prancheta com vento. */}
          <div className="flex gap-2 mt-2 items-start">
            {dividirEmColunas(c.grupos).map((coluna, idx) => (
              <table key={idx} className="flex-1 border-collapse text-[8pt]">
                <tbody>
                  {coluna.map((g) => (
                    /* Fragment com chave, e não `<>`: o cabeçalho do
                       grupo e as linhas dele são irmãos dentro do mesmo
                       map, e sem chave o React reclama da lista. */
                    <Fragment key={g.grupo}>
                      <tr>
                        <td
                          colSpan={2}
                          className="border border-black bg-black text-white px-1 py-[1px] text-[7.5pt] font-bold uppercase tracking-wide print:bg-black print:text-white"
                        >
                          {g.grupo}
                        </td>
                      </tr>
                      {g.itens.map((item) => (
                        <tr key={item.id}>
                          <td className="border border-black px-1 py-[2px] leading-[1.15]">
                            {item.nome}
                          </td>
                          {/* Riscar e somar no mesmo campo: uma coluna
                              de total separada espremeria o nome do
                              item até quebrar em duas linhas. */}
                          <td className="border border-black px-1 py-[2px] w-[64px]" />
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </section>
      )}

      {/* ── 2b. Grade de quadrats ─────────────────────── */}
      {c.quadrat && c.quadrat.campos.length > 0 && (
        <section className="mb-3 break-inside-avoid">
          <Titulo numero={2}>{c.quadrat.nome}</Titulo>
          <Nota>
            Uma linha por quadrat. Conte só o que estiver entre 1 e 5 mm — partícula menor que isso
            exige laboratório e não entra nesta ficha.
          </Nota>
          <table className="w-full border-collapse mt-2 text-[8.5pt]">
            <thead>
              <tr>
                <th className="border border-black px-1 py-1 w-[52px] text-[8pt]">Quadrat</th>
                {c.quadrat.campos.map((campo) => (
                  <th key={campo.id} className="border border-black px-1 py-1 text-[8pt] leading-tight">
                    {campo.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serie(LINHAS_DE_QUADRAT).map((n) => (
                <tr key={n}>
                  <td className="border border-black px-1 py-[5px] text-center font-bold">{n}</td>
                  {c.quadrat!.campos.map((campo) => (
                    <td key={campo.id} className="border border-black px-1 py-[5px]" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── 3. Ocorrências com foto ───────────────────── */}
      <section className="mb-3 break-inside-avoid">
        <Titulo numero={c.grupos.length > 0 || c.quadrat ? 3 : 1}>
          Ocorrências com foto — o que vira pino no mapa
        </Titulo>
        <Nota>{INSTRUCAO_DO_CODIGO}</Nota>
        <table className="w-full border-collapse mt-2 text-[8.5pt]">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 w-[58px] text-[8pt]">Código</th>
              <th className="border border-black px-1 py-1 text-[8pt]">
                O que é, e o que chamou a atenção
              </th>
              {c.pontual?.campos.map((campo) => (
                <th key={campo.id} className="border border-black px-1 py-1 text-[8pt] w-[92px]">
                  {campo.rotulo}
                </th>
              ))}
              <th className="border border-black px-1 py-1 w-[62px] text-[8pt] leading-tight">
                Quantos / tamanho
              </th>
              <th className="border border-black px-1 py-1 w-[46px] text-[8pt]">Foto?</th>
            </tr>
          </thead>
          <tbody>
            {serie(nLinhas).map((n) => (
              <tr key={n}>
                {/* O código vem impresso. Deixá-lo em branco para a
                    equipe preencher garantiria dois "E2-01" na mesma
                    expedição — e aí a foto não sabe a qual linha voltar. */}
                <td className="border border-black px-1 py-[7px] text-center font-mono font-bold text-[9pt]">
                  {codigoOcorrencia(equipe, n)}
                </td>
                <td className="border border-black px-1 py-[7px]" />
                {c.pontual?.campos.map((campo) => (
                  <td key={campo.id} className="border border-black px-1 py-[7px]" />
                ))}
                <td className="border border-black px-1 py-[7px]" />
                <td className="border border-black px-1 py-[7px] text-center">
                  <span className="inline-block w-[11px] h-[11px] border border-black" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── 4. Observações ────────────────────────────── */}
      <section className="break-inside-avoid">
        <Titulo numero={c.grupos.length > 0 || c.quadrat ? 4 : 2}>
          {c.qualitativo?.nome ?? "Observações da equipe"}
        </Titulo>
        {c.qualitativo && c.qualitativo.campos.length > 0 ? (
          <div className="space-y-2">
            {c.qualitativo.campos.map((campo) => (
              <div key={campo.id}>
                <div className="text-[8.5pt] font-semibold">{campo.rotulo}</div>
                <Pauta linhas={2} />
              </div>
            ))}
          </div>
        ) : (
          <Pauta linhas={4} />
        )}
      </section>

      <footer className="mt-3 pt-1.5 border-t border-black flex items-center justify-between text-[8pt]">
        <span className="flex gap-3">
          <Caixa rotulo="Conferi o esforço amostral" />
          <Caixa rotulo="Somei todos os totais" />
          <Caixa rotulo="Entreguei ao professor" />
        </span>
        <span>Página da equipe {equipe}</span>
      </footer>
    </article>
  );
}
