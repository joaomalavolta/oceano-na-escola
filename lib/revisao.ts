/**
 * Revisão da expedição.
 *
 * É a etapa que leva o dado da escola ao mapa público, e por isso a tela
 * não pode ser só uma lista bonita do que foi transcrito: ela precisa
 * responder, antes de publicar, se aquilo vai mesmo aparecer. Três
 * condições decidem isso, e nenhuma delas dá erro quando falha — o dado
 * simplesmente some. Estão todas conferidas aqui, como alertas:
 *
 *   1. expedicao.status = 'publicado'
 *   2. escola.publicada = true
 *   3. célula da grade com pelo menos três unidades amostrais
 *
 * Foto de ocorrência ainda exige escola.termos_ok e curadoria.
 */

import { supabase } from "./supabase";

export interface EscolaDaRevisao {
  id: number;
  nome: string;
  slug: string;
  publicada: boolean;
  termos_ok: boolean;
  /** Parecer do Ecosurf sobre o cadastro: pendente, aprovada, recusada. */
  situacao: string;
}

export interface CabecalhoRevisao {
  id: number;
  numero: number;
  titulo: string | null;
  data_campo: string;
  status: string;
  observacoes: string | null;
  n_mapeadores: number | null;
  extensao_m: number | null;
  validado_em: string | null;
  territorio: string | null;
  turmas: string[];
  escola: EscolaDaRevisao;
}

export interface UnidadeRevisada {
  id: number;
  equipe: string;
  tipo: string;
  areaM2: number | null;
  temGeometria: boolean;
  itens: number;
}

export interface LinhaContada {
  rotulo: string;
  grupo: string;
  quantidade: number;
}

/** Um protocolo aplicado na expedição, com o que ele produziu. */
export interface BlocoProtocolo {
  codigo: string;
  nome: string;
  cor: string | null;
  unidades: UnidadeRevisada[];
  areaM2: number;
  totalItens: number;
  /** Itens por metro quadrado. Nula quando falta esforço amostral. */
  densidade: number | null;
  linhas: LinhaContada[];
}

export interface OcorrenciaRevisada {
  id: number;
  protocolo: string;
  cor: string | null;
  item: string | null;
  valor: number | null;
  unidade: string | null;
  descricao: string;
  origem: string | null;
  fotos: number;
  fotosPublicadas: number;
}

export interface CelulaPrevista {
  protocolo: string;
  mes: string;
  unidadesDesta: number;
  unidadesNaCelula: number;
  entraNoMapa: boolean;
}

export interface Alerta {
  nivel: "impede" | "atencao";
  texto: string;
}

export interface Revisao {
  cabecalho: CabecalhoRevisao;
  blocos: BlocoProtocolo[];
  ocorrencias: OcorrenciaRevisada[];
  celulas: CelulaPrevista[];
  alertas: Alerta[];
  totalItens: number;
}

/** PostgREST serializa numeric como string. */
function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOuNulo(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Embed do PostgREST: objeto, ou array quando a relação é ambígua. */
function primeiro<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/** A ordem do enum status_dado. Índice -1 para status desconhecido. */
export const ETAPAS = ["rascunho", "enviado", "revisado", "validado", "publicado"] as const;
export type Etapa = (typeof ETAPAS)[number];

export function indiceDaEtapa(status: string): number {
  return ETAPAS.indexOf(status as Etapa);
}

/** Próxima etapa do fluxo, ou nula quando já está publicada. */
export function proximaEtapa(status: string): Etapa | null {
  const i = indiceDaEtapa(status);
  if (i < 0 || i >= ETAPAS.length - 1) return null;
  return ETAPAS[i + 1];
}

export async function carregarRevisao(
  expedicaoId: number
): Promise<{ revisao: Revisao | null; erro: string | null }> {
  try {
    const expRes = await supabase
      .from("expedicao")
      .select(
        "id, numero, titulo, data_campo, status, observacoes, n_mapeadores, extensao_m, validado_em, escola:escola_id (id, nome, slug, publicada, termos_ok, situacao), territorio:territorio_id (nome), equipe (id, identificacao), expedicao_turma (turma:turma_id (nome))"
      )
      .eq("id", expedicaoId)
      .maybeSingle();

    if (expRes.error) return { revisao: null, erro: expRes.error.message };
    if (!expRes.data) return { revisao: null, erro: null };

    const x = expRes.data;
    const escolaBruta = primeiro(x.escola as EscolaDaRevisao | EscolaDaRevisao[]);
    if (!escolaBruta) return { revisao: null, erro: "Expedição sem escola." };

    type TurmaEmbed = { turma: { nome: string } | { nome: string }[] | null };

    const equipes = new Map<number, string>(
      ((x.equipe ?? []) as { id: number; identificacao: string }[]).map((e) => [
        num(e.id),
        String(e.identificacao),
      ])
    );

    const cabecalho: CabecalhoRevisao = {
      id: num(x.id),
      numero: num(x.numero),
      titulo: x.titulo ?? null,
      data_campo: String(x.data_campo),
      status: String(x.status),
      observacoes: x.observacoes ?? null,
      n_mapeadores: numOuNulo(x.n_mapeadores),
      extensao_m: numOuNulo(x.extensao_m),
      validado_em: x.validado_em ?? null,
      territorio: primeiro(x.territorio as { nome: string } | { nome: string }[])?.nome ?? null,
      turmas: ((x.expedicao_turma ?? []) as TurmaEmbed[])
        .map((et) => primeiro(et.turma)?.nome)
        .filter((n): n is string => Boolean(n)),
      escola: {
        id: num(escolaBruta.id),
        nome: String(escolaBruta.nome),
        slug: String(escolaBruta.slug),
        publicada: Boolean(escolaBruta.publicada),
        termos_ok: Boolean(escolaBruta.termos_ok),
        situacao: String(escolaBruta.situacao ?? "aprovada"),
      },
    };

    // A geometria não vem no select: o formato que o PostgREST devolve
    // para geography varia com a versão, e aqui só interessa se existe.
    // Uma consulta separada devolve quais unidades estão sem ela.
    const [unidadesRes, semGeomRes, pontuaisRes, previaRes] = await Promise.all([
      supabase
        .from("unidade_amostral")
        .select(
          "id, equipe_id, tipo, area_m2, versao:versao_id (protocolo:protocolo_id (codigo, nome, cor))"
        )
        .eq("expedicao_id", expedicaoId)
        .order("id"),
      supabase.from("unidade_amostral").select("id").eq("expedicao_id", expedicaoId).is("geom", null),
      supabase
        .from("observacao_pontual")
        .select(
          "id, descricao, valor, origem_provavel, item:item_id (nome, unidade), versao:versao_id (protocolo:protocolo_id (codigo, nome, cor)), evidencia (id, status)"
        )
        .eq("expedicao_id", expedicaoId)
        .order("id"),
      supabase.rpc("previa_grade_expedicao", { p_expedicao_id: expedicaoId }),
    ]);

    const falha = unidadesRes.error ?? semGeomRes.error ?? pontuaisRes.error;
    if (falha) return { revisao: null, erro: falha.message };

    const semGeom = new Set((semGeomRes.data ?? []).map((u) => num(u.id)));

    type ProtoEmbed = {
      protocolo: { codigo: string; nome: string; cor: string | null }
        | { codigo: string; nome: string; cor: string | null }[]
        | null;
    };

    const unidadesBrutas = (unidadesRes.data ?? []).map((u) => {
      const versao = primeiro(u.versao as ProtoEmbed | ProtoEmbed[]);
      const p = primeiro(versao?.protocolo ?? null);
      return {
        id: num(u.id),
        equipe: equipes.get(num(u.equipe_id)) ?? "—",
        tipo: String(u.tipo),
        areaM2: numOuNulo(u.area_m2),
        temGeometria: !semGeom.has(num(u.id)),
        codigo: p?.codigo ?? "—",
        nome: p?.nome ?? "Protocolo não identificado",
        cor: p?.cor ?? null,
      };
    });

    // Contagens só das unidades desta expedição. Sem o filtro, o RLS
    // devolveria as da escola inteira e o total sairia inflado.
    const idsUnidades = unidadesBrutas.map((u) => u.id);
    const contagensRes = idsUnidades.length
      ? await supabase
          .from("observacao_contagem")
          .select(
            "unidade_id, quantidade, item:item_id (codigo, nome, grupo), campo:campo_id (rotulo)"
          )
          .in("unidade_id", idsUnidades)
      : { data: [], error: null };

    if (contagensRes.error) return { revisao: null, erro: contagensRes.error.message };

    const protocoloDaUnidade = new Map(unidadesBrutas.map((u) => [u.id, u.codigo]));
    const itensPorUnidade = new Map<number, number>();
    // Linhas somadas por protocolo. Chave de dois níveis para que dois
    // protocolos com o mesmo rótulo não se misturem.
    const linhasPorProtocolo = new Map<string, Map<string, LinhaContada>>();

    for (const c of contagensRes.data ?? []) {
      const qtd = num(c.quantidade);
      const uid = num(c.unidade_id);
      itensPorUnidade.set(uid, (itensPorUnidade.get(uid) ?? 0) + qtd);

      const codigo = protocoloDaUnidade.get(uid);
      if (!codigo) continue;

      const item = primeiro(
        c.item as { codigo: string; nome: string; grupo: string }
          | { codigo: string; nome: string; grupo: string }[]
      );
      const campo = primeiro(c.campo as { rotulo: string } | { rotulo: string }[]);

      // Resíduos conta por item de lista; microplástico, por campo da
      // ficha. As duas formas viram linha aqui.
      const rotulo = item ? `${item.codigo} · ${item.nome}` : campo?.rotulo ?? "Sem identificação";
      const grupo = item ? item.grupo : "Classe declarada em ficha";

      const linhas = linhasPorProtocolo.get(codigo) ?? new Map<string, LinhaContada>();
      const atual = linhas.get(rotulo);
      if (atual) atual.quantidade += qtd;
      else linhas.set(rotulo, { rotulo, grupo, quantidade: qtd });
      linhasPorProtocolo.set(codigo, linhas);
    }

    const blocos = new Map<string, BlocoProtocolo>();
    for (const u of unidadesBrutas) {
      const bloco = blocos.get(u.codigo) ?? {
        codigo: u.codigo,
        nome: u.nome,
        cor: u.cor,
        unidades: [],
        areaM2: 0,
        totalItens: 0,
        densidade: null,
        linhas: [],
      };
      const itens = itensPorUnidade.get(u.id) ?? 0;
      bloco.unidades.push({
        id: u.id,
        equipe: u.equipe,
        tipo: u.tipo,
        areaM2: u.areaM2,
        temGeometria: u.temGeometria,
        itens,
      });
      bloco.areaM2 += u.areaM2 ?? 0;
      bloco.totalItens += itens;
      blocos.set(u.codigo, bloco);
    }

    for (const bloco of blocos.values()) {
      // Densidade é sempre por protocolo. Somar resíduo com microplástico
      // produz um número que não descreve nenhum dos dois.
      bloco.densidade = bloco.areaM2 > 0 ? bloco.totalItens / bloco.areaM2 : null;
      bloco.linhas = [...(linhasPorProtocolo.get(bloco.codigo)?.values() ?? [])].sort(
        (a, b) => b.quantidade - a.quantidade
      );
    }

    type EvidenciaEmbed = { id: number; status: string };

    const ocorrencias: OcorrenciaRevisada[] = (pontuaisRes.data ?? []).map((o) => {
      const versao = primeiro(o.versao as ProtoEmbed | ProtoEmbed[]);
      const p = primeiro(versao?.protocolo ?? null);
      const item = primeiro(
        o.item as { nome: string; unidade: string | null } | { nome: string; unidade: string | null }[]
      );
      const evidencias = (o.evidencia ?? []) as EvidenciaEmbed[];
      return {
        id: num(o.id),
        protocolo: p?.codigo ?? "—",
        cor: p?.cor ?? null,
        item: item?.nome ?? null,
        valor: numOuNulo(o.valor),
        unidade: item?.unidade ?? null,
        descricao: String(o.descricao),
        origem: o.origem_provavel ?? null,
        fotos: evidencias.length,
        fotosPublicadas: evidencias.filter((e) => e.status === "publicada").length,
      };
    });

    const celulas: CelulaPrevista[] = (
      (previaRes.data ?? []) as {
        protocolo: string;
        mes: string;
        unidades_desta_expedicao: number;
        unidades_na_celula: number;
        entra_no_mapa: boolean;
      }[]
    ).map((c) => ({
      protocolo: String(c.protocolo),
      mes: String(c.mes),
      unidadesDesta: num(c.unidades_desta_expedicao),
      unidadesNaCelula: num(c.unidades_na_celula),
      entraNoMapa: Boolean(c.entra_no_mapa),
    }));

    const totalItens = [...blocos.values()].reduce((s, b) => s + b.totalItens, 0);

    return {
      revisao: {
        cabecalho,
        blocos: [...blocos.values()].sort((a, b) => a.codigo.localeCompare(b.codigo)),
        ocorrencias,
        celulas,
        alertas: montarAlertas(
          cabecalho,
          [...blocos.values()],
          ocorrencias,
          celulas,
          previaRes.error?.message ?? null
        ),
        totalItens,
      },
      erro: null,
    };
  } catch (e) {
    return { revisao: null, erro: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * O que a revisão tem de dizer antes de publicar.
 *
 * 'impede' é o que faz o dado não aparecer no mapa mesmo depois de
 * publicado; 'atencao' é o que empobrece o dado sem escondê-lo.
 */
function montarAlertas(
  cabecalho: CabecalhoRevisao,
  blocos: BlocoProtocolo[],
  ocorrencias: OcorrenciaRevisada[],
  celulas: CelulaPrevista[],
  erroPrevia: string | null
): Alerta[] {
  const alertas: Alerta[] = [];

  if (blocos.length === 0 && ocorrencias.length === 0) {
    alertas.push({
      nivel: "impede",
      texto: "Nenhuma unidade amostral e nenhuma ocorrência. Não há o que publicar.",
    });
  }

  // Duas causas para o mesmo efeito, e o nível difere pelo que o
  // professor pode fazer a respeito — não pela gravidade.
  //
  // Escola fora do ar por escolha dela mesma tem conserto num clique,
  // aqui na tela: 'impede', e o botão de publicar espera o clique.
  // Cadastro em análise no Ecosurf não tem conserto nenhum do lado do
  // professor, e travar a publicação por isso seria contradizer o que a
  // plataforma promete em todo lugar — que o trabalho não espera a
  // aprovação. Fica 'atencao', o dado é publicado, e ele entra no mapa
  // junto com a escola. É o mesmo desenho da célula abaixo do piso de
  // três unidades: guardada, e entra quando a condição chegar.
  if (!cabecalho.escola.publicada) {
    if (cabecalho.escola.situacao === "recusada") {
      alertas.push({
        nivel: "atencao",
        texto: `O cadastro de ${cabecalho.escola.nome} foi recusado pelo Instituto Ecosurf, e o motivo está na ficha da escola. Publicar aqui não se perde: o dado fica guardado e entra no mapa quando o cadastro for corrigido, reenviado e aprovado.`,
      });
    } else if (cabecalho.escola.situacao === "pendente") {
      alertas.push({
        nivel: "atencao",
        texto: `O cadastro de ${cabecalho.escola.nome} está em análise no Instituto Ecosurf. Publicar aqui não se perde: o dado fica guardado e entra no mapa junto com a escola, assim que ela for aprovada.`,
      });
    } else {
      alertas.push({
        nivel: "impede",
        texto: `A escola ${cabecalho.escola.nome} está fora do ar. Enquanto estiver, nada dela aparece no mapa, mesmo com a expedição publicada.`,
      });
    }
  }

  // Faltar coordenada em parte das unidades não é o mesmo que faltar em
  // todas. Antes bloqueava nos dois casos, e travava a publicação de
  // uma expedição em que três trechos de cinco iriam ao mapa
  // perfeitamente — o professor não tinha como concluir por causa das
  // outras duas, que talvez nunca tenham tido GPS.
  //
  // Bloqueia só quando publicar não levaria nada: nenhuma unidade com
  // geometria e nenhuma ocorrência georreferenciada. Aí o botão diz
  // "publicar no mapa" e o mapa não recebe nada — é essa promessa vazia
  // que o impedimento evita.
  const unidades = blocos.flatMap((b) => b.unidades);
  const semGeometria = unidades.filter((u) => !u.temGeometria);
  if (semGeometria.length > 0) {
    const nadaVaiAoMapa = semGeometria.length === unidades.length && ocorrencias.length === 0;
    alertas.push({
      nivel: nadaVaiAoMapa ? "impede" : "atencao",
      texto: nadaVaiAoMapa
        ? `Nenhuma das ${unidades.length} unidade(s) amostral(is) tem coordenada, e não há ocorrência georreferenciada. Publicar não levaria nada ao mapa: sem geometria a contagem não entra em célula nenhuma da grade. Volte à transcrição e marque onde a turma esteve.`
        : `${semGeometria.length} de ${unidades.length} unidade(s) amostral(is) sem coordenada. Essas contagens entram no total da expedição, mas não em célula nenhuma da grade — o que tem coordenada vai ao mapa normalmente.`,
    });
  }

  for (const bloco of blocos) {
    const semArea = bloco.unidades.filter((u) => u.areaM2 === null || u.areaM2 <= 0);
    if (semArea.length > 0) {
      alertas.push({
        nivel: "atencao",
        texto: `${bloco.codigo}: ${semArea.length} unidade(s) sem área amostrada. A contagem entra no total, mas não vira densidade.`,
      });
    }
    if (bloco.totalItens === 0) {
      alertas.push({
        nivel: "atencao",
        texto: `${bloco.codigo}: nenhuma contagem transcrita. Zero é um resultado legítimo — confira se é isso mesmo.`,
      });
    }
  }

  if (erroPrevia) {
    alertas.push({
      nivel: "atencao",
      texto: `Não foi possível prever quais células entram no mapa: ${erroPrevia}`,
    });
  } else {
    const foraDoMapa = celulas.filter((c) => !c.entraNoMapa);
    if (foraDoMapa.length > 0) {
      alertas.push({
        nivel: "atencao",
        texto: `${foraDoMapa.length} de ${celulas.length} célula(s) ficam abaixo do piso de três unidades amostrais e não aparecem no mapa. O dado fica guardado e entra quando outra expedição completar a célula.`,
      });
    }
  }

  const comFoto = ocorrencias.filter((o) => o.fotos > 0);
  if (comFoto.length > 0 && !cabecalho.escola.termos_ok) {
    alertas.push({
      nivel: "atencao",
      texto: `${comFoto.length} ocorrência(s) com foto, mas a escola não registrou o termo de uso de imagem. As fotos ficam fora da galeria pública.`,
    });
  }

  const naoCuradas = comFoto.filter((o) => o.fotosPublicadas === 0).length;
  if (naoCuradas > 0 && cabecalho.escola.termos_ok) {
    alertas.push({
      nivel: "atencao",
      texto: `${naoCuradas} ocorrência(s) com foto ainda sem curadoria. Foto sem curadoria não vai para o mapa.`,
    });
  }

  return alertas;
}

/**
 * Move a expedição uma etapa, para frente ou para trás.
 *
 * A regra de quais transições valem está no banco, no gatilho
 * trg_expedicao_transicao. Aqui só se chama o update e se devolve o
 * motivo da recusa, quando houver.
 */
export async function moverStatus(
  expedicaoId: number,
  novoStatus: string
): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("expedicao")
    .update({ status: novoStatus })
    .eq("id", expedicaoId);
  return { erro: error?.message ?? null };
}

/**
 * Põe a escola no mapa, para que o que foi publicado apareça de fato.
 *
 * Passa pela função no banco, e não por update direto: `publicada`
 * deixou de ser concedida ao cliente quando o cadastro passou a ter
 * análise do Ecosurf. O update direto aqui deixaria de funcionar em
 * silêncio, devolvendo "permission denied for table escola" no lugar
 * de uma frase que alguém entenda.
 *
 * Só funciona com o cadastro já aprovado — a função confere isso. Para
 * escola pendente ou recusada a tela nem oferece o botão, porque não é
 * o professor que resolve.
 */
export async function publicarEscola(escolaId: number): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc("escola_define_visibilidade", {
    p_escola_id: escolaId,
    p_publicada: true,
  });
  return { erro: error?.message ?? null };
}
