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
  total_itens: number;
  area_amostrada_m2: number;
  /** itens/m² — null quando a área é zero */
  densidade_itens_m2: number | null;
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
