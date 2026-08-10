"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { 
  School, 
  MapPin, 
  Compass, 
  ImageIcon, 
  Info, 
  Lock, 
  Calendar, 
  Users, 
  Map as MapIcon,
  CheckCircle2
} from "lucide-react";
import { 
  getLocalStorageData, 
  MOCK_ESCOLAS, 
  MOCK_EXPEDICOES, 
  MOCK_GALERIA, 
  EscolaDetalhada, 
  ExpedicaoDetalhada, 
  FotoGaleria 
} from "@/lib/dados-mock";

const MapaPublico = dynamic(
  () => import("@/components/mapa/mapa-publico").then((mod) => mod.MapaPublico),
  { ssr: false }
);

export default function EscolaPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [escola, setEscola] = useState<EscolaDetalhada | null>(null);
  const [expedicoes, setExpedicoes] = useState<ExpedicaoDetalhada[]>([]);
  const [galeria, setGaleria] = useState<FotoGaleria[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<"sobre" | "mapa" | "expedicoes" | "galeria">("sobre");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const escolas = getLocalStorageData<EscolaDetalhada[]>("escolas", MOCK_ESCOLAS);
    const encontrada = escolas.find((e) => e.slug === slug);

    if (encontrada) {
      setEscola(encontrada);

      const todasExpedicoes = getLocalStorageData<ExpedicaoDetalhada[]>("expedicoes", MOCK_EXPEDICOES);
      const validadasEscola = todasExpedicoes.filter(
        (exp) => exp.escola_slug === slug && exp.status === "validado"
      );
      setExpedicoes(validadasEscola);

      const fotos = getLocalStorageData<FotoGaleria[]>("galeria", MOCK_GALERIA);
      const fotosEscola = fotos.filter((f) => f.escola_slug === slug && f.curada);
      setGaleria(fotosEscola);
    }

    setCarregando(false);
  }, [slug]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BarraNavegacao />
        <main className="flex-1 flex items-center justify-center">
          <EstadoContainer estado="carregando">{null}</EstadoContainer>
        </main>
      </div>
    );
  }

  if (!escola) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BarraNavegacao />
        <main className="flex-1 max-w-4xl mx-auto w-full p-8">
          <EstadoContainer
            estado="erro"
            mensagemErro="Escola não encontrada na rede Oceano na Escola."
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      {/* Banner de Apresentação da Escola */}
      <div className="bg-card border-b border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-sm">
                Rede de Ciências do Mar
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {escola.municipio} – {escola.uf}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {escola.nome}
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              {escola.apresentacao}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-secondary/80 border border-border p-4 rounded-md">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block font-semibold">Expedições</span>
              <span className="text-lg font-bold tabular-nums text-foreground">{expedicoes.length}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block font-semibold">Status Termos</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {escola.termos_ok ? "Verificados" : "Pendentes"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="bg-card border-b border-border sticky top-14 z-20">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { id: "sobre", label: "Sobre a Escola", icon: Info },
            { id: "mapa", label: "Mapa do Território", icon: MapIcon },
            { id: "expedicoes", label: `Expedições (${expedicoes.length})`, icon: Compass },
            { id: "galeria", label: "Galeria de Fotos", icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const ativa = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id as typeof abaAtiva)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                  ativa
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {/* Aba 1: Sobre */}
        {abaAtiva === "sobre" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-md p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
                Apresentação & Projeto Pedagógico
              </h2>
              <p className="text-xs text-foreground leading-relaxed">
                {escola.apresentacao}
              </p>
              {escola.endereco && (
                <div className="text-xs text-muted-foreground pt-2">
                  <strong>Endereço:</strong> {escola.endereco}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba 2: Mapa Recortado */}
        {abaAtiva === "mapa" && (
          <div className="h-[550px] border border-border rounded-md overflow-hidden relative shadow-sm">
            <MapaPublico />
          </div>
        )}

        {/* Aba 3: Expedições */}
        {abaAtiva === "expedicoes" && (
          <EstadoContainer
            estado={expedicoes.length === 0 ? "vazio" : "pronto"}
            mensagemVazia="Esta escola ainda não possui expedições validadas e publicadas."
          >
            <div className="space-y-3">
              {expedicoes.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-card border border-border rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">{exp.titulo}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {exp.data_campo}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {exp.praia}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {exp.turma_nome}</span>
                    </div>
                  </div>
                  <Link
                    href={`/expedicoes/${exp.id}/revisar`}
                    className="px-3 py-1.5 text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 border border-border rounded-sm text-center"
                  >
                    Ver Resumo
                  </Link>
                </div>
              ))}
            </div>
          </EstadoContainer>
        )}

        {/* Aba 4: Galeria de Fotos */}
        {abaAtiva === "galeria" && (
          <div>
            {!escola.termos_ok ? (
              <div className="p-8 border border-dashed border-border rounded-md text-center bg-card/60 space-y-2">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">
                  Galeria indisponível temporariamente
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Por motivos de privacidade e conformidade, a galeria de imagens públicas só é ativada após a verificação dos termos de autorização na secretaria da escola.
                </p>
              </div>
            ) : galeria.length === 0 ? (
              <EstadoContainer estado="vazio" mensagemVazia="Nenhuma foto curada publicada na galeria ainda." children={null} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {galeria.map((foto) => (
                  <div key={foto.id} className="bg-card border border-border rounded-md overflow-hidden shadow-2xs">
                    {/* eslint-disable-next-html-element */}
                    <img
                      src={foto.url}
                      alt={foto.titulo}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-xs font-bold text-foreground">{foto.titulo}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Foto por: {foto.autor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
