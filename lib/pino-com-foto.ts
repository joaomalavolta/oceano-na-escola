/**
 * O que falta para o pino aparecer com foto no mapa.
 *
 * São quatro condições independentes, e nenhuma tela dizia isso junto:
 * a saída publicada, a foto publicada (curadoria), a escola com termo de
 * uso de imagem e a escola publicada. Faltando qualquer uma, o pino
 * aparece sem foto — ou nem aparece — e ninguém sabe por quê.
 *
 * Só lógica pura: a tela de revisão monta o resumo a partir do que já
 * carregou.
 */

export interface OcorrenciaComFotos {
  fotos: number;
  fotosPublicadas: number;
}

export interface SituacaoDasFotos {
  ocorrencias: number;
  semFoto: number;
  /** Pinos com pelo menos uma foto publicada. */
  comFotoPublicada: number;
  /** Pinos com foto, nenhuma ainda publicada. */
  aguardandoCuradoria: number;
  /** Fotos ainda não publicadas, somadas. */
  fotosAguardando: number;
  /** O que impede qualquer foto desta escola de aparecer, em português. */
  bloqueios: string[];
}

export function situacaoDasFotos(
  escola: { termos_ok: boolean; publicada: boolean },
  ocorrencias: OcorrenciaComFotos[]
): SituacaoDasFotos {
  const semFoto = ocorrencias.filter((o) => o.fotos === 0).length;
  const comFotoPublicada = ocorrencias.filter((o) => o.fotosPublicadas > 0).length;
  const aguardandoCuradoria = ocorrencias.filter((o) => o.fotos > 0 && o.fotosPublicadas === 0).length;
  const fotosAguardando = ocorrencias.reduce((s, o) => s + Math.max(0, o.fotos - o.fotosPublicadas), 0);

  const bloqueios: string[] = [];
  if (!escola.termos_ok)
    bloqueios.push(
      "A escola não registrou o termo de uso de imagem. Sem ele, nenhuma foto aparece em página pública — confirme o termo na ficha da escola."
    );
  if (!escola.publicada) bloqueios.push("A escola não está publicada: nada dela aparece no mapa ainda.");

  return {
    ocorrencias: ocorrencias.length,
    semFoto,
    comFotoPublicada,
    aguardandoCuradoria,
    fotosAguardando,
    bloqueios,
  };
}
