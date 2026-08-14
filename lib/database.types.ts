/**
 * Tipos derivados das views públicas do banco.
 * Fonte: supabase/migrations/20260810203118_rls_e_views_publicas.sql
 *
 * Quando o Supabase CLI gerar `database.types.ts`, esses tipos devem
 * bater com Database["public"]["Views"]["pub_*"].
 */

export interface PubEscola {
  id: number;
  slug: string;
  nome: string;
  apresentacao: string | null;
  municipio: string;
  uf: string;
  lat: number;
  lng: number;
}

export interface PubObservacaoGrade {
  /** GeoJSON string de um polígono (quadrado 100 m) */
  celula_geojson: string;
  escola_slug: string;
  protocolo: string;
  /** Primeiro dia do mês da expedição */
  mes: string;
  /** Quantas unidades amostrais sustentam a célula. A view só publica
   *  célula a partir de três — abaixo disso ela seria uma coordenada. */
  unidades_amostrais: number;
  total_itens: number;
  area_amostrada_m2: number;
  /** itens/m² — null quando a área é zero */
  densidade_itens_m2: number | null;
}

/** Um protocolo com versão ativa. O mapa monta as camadas a partir daqui. */
export interface PubProtocolo {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  /** Hex. Gera o pin e a rampa de densidade, sem passar pelo código. */
  cor: string | null;
  unidade_medida: string | null;
  /** densidade | ocorrencia | area_afetada | medida | nenhuma */
  forma_agregacao: string;
}

/** Ocorrência ambiental como pin, em coordenada exata. */
export interface PubObservacaoPontual {
  id: number;
  escola_slug: string;
  escola_nome: string;
  protocolo: string;
  protocolo_nome: string;
  protocolo_icone: string | null;
  protocolo_cor: string | null;
  item_codigo: string | null;
  item_nome: string | null;
  item_grupo: string | null;
  item_icone: string | null;
  item_unidade: string | null;
  /** Magnitude na unidade do item: 3 pontos, 30 m². */
  valor: number | null;
  descricao: string;
  origem_provavel: string | null;
  expedicao_numero: number;
  data_campo: string;
  /** GeoJSON de um Point. */
  ponto_geojson: string;
}

export interface PubIndicadorEscola {
  escola_slug: string;
  expedicoes: number;
  extensao_total_m: number;
  itens_catalogados: number;
  registros_pontuais: number;
}

export interface PubExpedicao {
  id: number;
  numero: number;
  titulo: string | null;
  data_campo: string;
  extensao_m: number | null;
  n_mapeadores: number | null;
  n_equipes: number | null;
  escola_slug: string;
  escola_nome: string;
  territorio: string | null;
  percurso_geojson: string | null;
}

/** Foto de ocorrência, na coordenada exata da ocorrência que documenta. */
export interface PubFotoGeorreferenciada {
  id: number;
  /** A ocorrência documentada. Ligue por aqui, nunca pela coordenada em
   *  texto: as duas views já divergiram uma vez, e ninguém percebeu. */
  pontual_id: number;
  storage_path: string;
  legenda: string | null;
  publicada_em: string | null;
  escola_slug: string;
  escola_nome: string;
  protocolo: string;
  protocolo_icone: string | null;
  protocolo_cor: string | null;
  item_nome: string | null;
  item_icone: string | null;
  item_unidade: string | null;
  valor: number | null;
  ocorrencia: string;
  origem_provavel: string | null;
  expedicao_numero: number;
  data_campo: string;
  ponto_geojson: string;
}

/** Foto de expedição curada, sem posição. */
export interface PubGaleria {
  id: number;
  storage_path: string;
  legenda: string | null;
  publicada_em: string | null;
  escola_slug: string;
  expedicao_numero: number | null;
}

/** Indicadores agregados para a faixa do rodapé do mapa */
export interface IndicadoresGerais {
  escolas: number;
  expedicoes: number;
  observacoes: number;
  km_monitorados: number;
  itens_catalogados: number;
}

/**
 * Forma reduzida do tipo que o Supabase CLI gera.
 * Escrita como interface, e não namespace, porque `public` é palavra
 * reservada em modo estrito — e todo módulo ES é modo estrito.
 * O gerador criará Database["public"]["Views"] com essas mesmas shapes.
 */
export interface Database {
  public: {
    Views: {
      pub_escola: { Row: PubEscola };
      pub_observacao_grade: { Row: PubObservacaoGrade };
      pub_indicador_escola: { Row: PubIndicadorEscola };
      pub_expedicao: { Row: PubExpedicao };
    };
  };
}
