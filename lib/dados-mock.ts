/**
 * Dados de demonstração e persistência local (localStorage) para prototipagem
 * de todas as telas do Oceano na Escola.
 */

export interface ProtocoloItem {
  id: number;
  codigo: string;
  nome: string;
  grupo: string;
  ordem: number;
}

export const PROTOCOLO_RES_ITENS: ProtocoloItem[] = [
  { id: 1, codigo: "PL01", nome: "Bituca de cigarro", grupo: "Plástico", ordem: 1 },
  { id: 2, codigo: "PL02", nome: "Sacola plástica", grupo: "Plástico", ordem: 2 },
  { id: 3, codigo: "PL03", nome: "Garrafa PET", grupo: "Plástico", ordem: 3 },
  { id: 4, codigo: "PL04", nome: "Tampa ou tampinha", grupo: "Plástico", ordem: 4 },
  { id: 5, codigo: "PL05", nome: "Canudo", grupo: "Plástico", ordem: 5 },
  { id: 6, codigo: "PL06", nome: "Copo descartável", grupo: "Plástico", ordem: 6 },
  { id: 7, codigo: "PL07", nome: "Talher, prato ou mexedor", grupo: "Plástico", ordem: 7 },
  { id: 8, codigo: "PL08", nome: "Embalagem de salgadinho, biscoito ou bala", grupo: "Plástico", ordem: 8 },
  { id: 9, codigo: "PL09", nome: "Cotonete ou haste plástica", grupo: "Plástico", ordem: 9 },
  { id: 10, codigo: "PL10", nome: "Absorvente, fralda ou aplicador", grupo: "Plástico", ordem: 10 },
  { id: 11, codigo: "PL11", nome: "Linha, anzol ou isca de pesca", grupo: "Plástico", ordem: 11 },
  { id: 12, codigo: "PL12", nome: "Corda, cabo ou rede", grupo: "Plástico", ordem: 12 },
  { id: 13, codigo: "PL13", nome: "Fragmento de plástico duro > 2,5 cm", grupo: "Plástico", ordem: 13 },
  { id: 14, codigo: "PL14", nome: "Chinelo, calçado ou brinquedo", grupo: "Plástico", ordem: 14 },
  { id: 15, codigo: "PL15", nome: "Máscara ou luva descartável", grupo: "Plástico", ordem: 15 },
  { id: 16, codigo: "PL16", nome: "Ponta ou pedaço de balão", grupo: "Plástico", ordem: 16 },
  { id: 17, codigo: "EP01", nome: "Caixa, prato ou bandeja de isopor", grupo: "Isopor e espumas", ordem: 17 },
  { id: 18, codigo: "EP02", nome: "Fragmento de isopor > 2,5 cm", grupo: "Isopor e espumas", ordem: 18 },
  { id: 19, codigo: "EP03", nome: "Espuma ou esponja", grupo: "Isopor e espumas", ordem: 19 },
  { id: 20, codigo: "MT01", nome: "Lata de alumínio", grupo: "Metal", ordem: 20 },
  { id: 21, codigo: "MT02", nome: "Tampa metálica ou lacre", grupo: "Metal", ordem: 21 },
  { id: 22, codigo: "MT03", nome: "Outro metal", grupo: "Metal", ordem: 22 },
  { id: 23, codigo: "VD01", nome: "Garrafa de vidro", grupo: "Vidro", ordem: 23 },
  { id: 24, codigo: "VD02", nome: "Caco de vidro", grupo: "Vidro", ordem: 24 },
  { id: 25, codigo: "PA01", nome: "Papel, papelão ou embalagem cartonada", grupo: "Papel", ordem: 25 },
  { id: 26, codigo: "BR01", nome: "Borracha, pneu ou câmara de ar", grupo: "Borracha", ordem: 26 },
  { id: 27, codigo: "TX01", nome: "Tecido, roupa ou pano", grupo: "Tecido", ordem: 27 },
  { id: 28, codigo: "MD01", nome: "Madeira processada, palito ou tábua", grupo: "Madeira", ordem: 28 },
  { id: 29, codigo: "SA01", nome: "Resíduo de saúde: seringa, agulha, etc.", grupo: "Saúde", ordem: 29 },
  { id: 30, codigo: "OU01", nome: "Outro (descrever nas observações)", grupo: "Outros", ordem: 30 },
];

export interface EscolaDetalhada {
  id: number;
  slug: string;
  nome: string;
  apresentacao: string | null;
  municipio: string;
  uf: string;
  endereco: string | null;
  lat: number;
  lng: number;
  termos_ok: boolean;
  criado_em: string;
}

export interface Turma {
  id: number;
  escola_id: number;
  nome: string;
  ano_letivo: number;
  nivel: string;
}

export interface Equipe {
  id: number;
  nome: string;
  comprimento_m: number;
  largura_m: number;
  area_m2: number;
  peso_kg?: number;
}

export interface ExpedicaoDetalhada {
  id: number;
  numero: number;
  titulo: string;
  escola_id: number;
  escola_slug: string;
  escola_nome: string;
  turma_id: number;
  turma_nome: string;
  protocolo_codigo: string;
  data_campo: string;
  hora_inicio?: string;
  hora_fim?: string;
  praia: string;
  n_mapeadores: number;
  mare?: string;
  chuva_24h?: string;
  vento?: string;
  status: "rascunho" | "enviado" | "validado" | "devolvido";
  equipes: Equipe[];
  contagens: Record<string, Record<number, number>>;
  observacoes_texto?: string;
  foto_ficha_url?: string;
  criado_em: string;
}

export interface FotoGaleria {
  id: number;
  escola_slug: string;
  expedicao_id: number;
  url: string;
  titulo: string;
  autor: string;
  curada: boolean;
}

export const MOCK_ESCOLAS: EscolaDetalhada[] = [
  {
    id: 1,
    slug: "em-prof-maria-alice",
    nome: "E.M. Profª Maria Alice Borges Ghion",
    apresentacao: "Escola municipal localizada próxima à Praia do Sonho em Itanhaém. Participa ativamente da rede de ciências do mar desde 2024.",
    municipio: "Itanhaém",
    uf: "SP",
    endereco: "Rua das Flores, 120 - Praia do Sonho, Itanhaém - SP",
    lat: -24.1875,
    lng: -46.8015,
    termos_ok: true,
    criado_em: "2024-03-10",
  },
  {
    id: 2,
    slug: "em-joao-batista",
    nome: "E.M. João Batista Rodrigues",
    apresentacao: "Escola de ensino fundamental no bairro Suarão, com acesso direto à praia homônima para saídas de campo quinzenais.",
    municipio: "Itanhaém",
    uf: "SP",
    endereco: "Av. Suarão, 850 - Suarão, Itanhaém - SP",
    lat: -24.1735,
    lng: -46.7645,
    termos_ok: true,
    criado_em: "2024-04-15",
  },
  {
    id: 3,
    slug: "ee-luiz-sergio",
    nome: "E.E. Prof. Luiz Sérgio Claudino dos Santos",
    apresentacao: "Escola estadual no centro de Itanhaém, monitora a praia central e a foz do Rio Itanhaém.",
    municipio: "Itanhaém",
    uf: "SP",
    endereco: "Rua Uriri, 45 - Centro, Itanhaém - SP",
    lat: -24.1830,
    lng: -46.7885,
    termos_ok: true,
    criado_em: "2024-05-02",
  },
  {
    id: 4,
    slug: "em-cibratel",
    nome: "E.M. Cibratel",
    apresentacao: "Escola municipal no Cibratel II, dedicada ao estudo de microplásticos e resíduos na Praia do Cibratel.",
    municipio: "Itanhaém",
    uf: "SP",
    endereco: "Rua Copacabana, 300 - Cibratel II, Itanhaém - SP",
    lat: -24.2005,
    lng: -46.8220,
    termos_ok: false,
    criado_em: "2024-06-11",
  },
];

export const MOCK_TURMAS: Turma[] = [
  { id: 1, escola_id: 1, nome: "7º Ano A", ano_letivo: 2026, nivel: "Ensino Fundamental II" },
  { id: 2, escola_id: 1, nome: "8º Ano B", ano_letivo: 2026, nivel: "Ensino Fundamental II" },
  { id: 3, escola_id: 2, nome: "9º Ano A", ano_letivo: 2026, nivel: "Ensino Fundamental II" },
  { id: 4, escola_id: 3, nome: "1º Ano EM", ano_letivo: 2026, nivel: "Ensino Médio" },
  { id: 5, escola_id: 4, nome: "6º Ano C", ano_letivo: 2026, nivel: "Ensino Fundamental II" },
];

export const MOCK_EXPEDICOES: ExpedicaoDetalhada[] = [
  {
    id: 101,
    numero: 1,
    titulo: "Expedição Outono — Praia do Sonho",
    escola_id: 1,
    escola_slug: "em-prof-maria-alice",
    escola_nome: "E.M. Profª Maria Alice Borges Ghion",
    turma_id: 1,
    turma_nome: "7º Ano A",
    protocolo_codigo: "RES",
    data_campo: "2026-05-15",
    hora_inicio: "08:30",
    hora_fim: "11:00",
    praia: "Praia do Sonho",
    n_mapeadores: 24,
    mare: "Baixa (0.3m)",
    chuva_24h: "Não",
    vento: "Fraco (SE)",
    status: "validado",
    equipes: [
      { id: 1, nome: "Equipe Alfa", comprimento_m: 50, largura_m: 10, area_m2: 500, peso_kg: 3.4 },
      { id: 2, nome: "Equipe Beta", comprimento_m: 50, largura_m: 10, area_m2: 500, peso_kg: 2.1 },
    ],
    contagens: {
      "1": { 1: 45, 2: 12, 3: 8, 4: 15, 5: 6, 8: 14, 13: 22, 17: 5, 20: 3, 23: 2 },
      "2": { 1: 30, 2: 8, 3: 5, 4: 10, 5: 4, 8: 9, 13: 15, 17: 3, 20: 1, 23: 0 },
    },
    observacoes_texto: "Alta concentração de bitucas de cigarro perto do quiosque principal.",
    foto_ficha_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    criado_em: "2026-05-16",
  },
  {
    id: 102,
    numero: 2,
    titulo: "Expedição Inverno — Limpeza & Monitoramento",
    escola_id: 1,
    escola_slug: "em-prof-maria-alice",
    escola_nome: "E.M. Profª Maria Alice Borges Ghion",
    turma_id: 2,
    turma_nome: "8º Ano B",
    protocolo_codigo: "RES",
    data_campo: "2026-06-20",
    hora_inicio: "09:00",
    hora_fim: "11:30",
    praia: "Praia do Sonho",
    n_mapeadores: 28,
    mare: "Média (0.7m)",
    chuva_24h: "Sim (Fraca)",
    vento: "Moderado (S)",
    status: "enviado",
    equipes: [
      { id: 1, nome: "Equipe Tartaruga", comprimento_m: 50, largura_m: 10, area_m2: 500, peso_kg: 4.8 },
      { id: 2, nome: "Equipe Golfinho", comprimento_m: 50, largura_m: 10, area_m2: 500, peso_kg: 3.9 },
    ],
    contagens: {
      "1": { 1: 60, 2: 25, 3: 14, 4: 28, 5: 12, 8: 30, 13: 40, 17: 8, 20: 6, 23: 4 },
      "2": { 1: 52, 2: 18, 3: 11, 4: 22, 5: 9, 8: 24, 13: 31, 17: 6, 20: 4, 23: 3 },
    },
    observacoes_texto: "Presença de resíduos de pesca e cordas de nylon trazidas pela maré forte.",
    foto_ficha_url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80",
    criado_em: "2026-06-21",
  },
  {
    id: 103,
    numero: 3,
    titulo: "Monitoramento de Primavera — Suarão",
    escola_id: 2,
    escola_slug: "em-joao-batista",
    escola_nome: "E.M. João Batista Rodrigues",
    turma_id: 3,
    turma_nome: "9º Ano A",
    protocolo_codigo: "RES",
    data_campo: "2026-07-10",
    hora_inicio: "08:00",
    hora_fim: "10:30",
    praia: "Praia do Suarão",
    n_mapeadores: 20,
    mare: "Baixa",
    chuva_24h: "Não",
    vento: "Fraco",
    status: "rascunho",
    equipes: [
      { id: 1, nome: "Equipe Mar", comprimento_m: 50, largura_m: 10, area_m2: 500 },
    ],
    contagens: {
      "1": { 1: 15, 2: 5, 3: 3, 4: 6 },
    },
    criado_em: "2026-07-11",
  },
];

export const MOCK_GALERIA: FotoGaleria[] = [
  {
    id: 1,
    escola_slug: "em-prof-maria-alice",
    expedicao_id: 101,
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    titulo: "Equipe em medição de transecto",
    autor: "Profª Helena",
    curada: true,
  },
  {
    id: 2,
    escola_slug: "em-prof-maria-alice",
    expedicao_id: 101,
    url: "https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=800&q=80",
    titulo: "Triagem dos resíduos recolhidos",
    autor: "Profª Helena",
    curada: true,
  },
  {
    id: 3,
    escola_slug: "em-joao-batista",
    expedicao_id: 103,
    url: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
    titulo: "Vista panorâmica do trecho monitorado no Suarão",
    autor: "Prof. Marcos",
    curada: true,
  },
];

export function getLocalStorageData<T>(key: string, defaultData: T): T {
  if (typeof window === "undefined") return defaultData;
  try {
    const item = localStorage.getItem(`oceano_${key}`);
    return item ? JSON.parse(item) : defaultData;
  } catch {
    return defaultData;
  }
}

export function setLocalStorageData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`oceano_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error("Erro ao salvar no localStorage:", err);
  }
}
