"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import {
  listarPerfisDaRede,
  listarEscolasAdministraveis,
  definirPapel,
  criarVinculo,
  removerVinculo,
  PAPEIS,
  type PerfilDaRede,
  type Papel,
} from "@/lib/administracao";

interface EscolaDaRede {
  id: number;
  nome: string;
  slug: string;
  publicada: boolean;
  termos_ok: boolean;
}

function AdminConteudo() {
  const [perfis, setPerfis] = useState<PerfilDaRede[] | null>(null);
  const [escolas, setEscolas] = useState<EscolaDaRede[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [vinculando, setVinculando] = useState<Record<string, number | "">>({});

  const recarregar = async () => {
    const [ps, es] = await Promise.all([listarPerfisDaRede(), listarEscolasAdministraveis()]);
    setPerfis(ps);
    setEscolas(es);
  };

  useEffect(() => {
    let ativo = true;
    Promise.all([listarPerfisDaRede(), listarEscolasAdministraveis()]).then(([ps, es]) => {
      if (!ativo) return;
      setPerfis(ps);
      setEscolas(es);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const agir = async (acao: () => Promise<{ erro: string | null }>, sucesso: string) => {
    setOcupado(true);
    setAviso(null);
    const { erro } = await acao();
    if (erro) {
      setOcupado(false);
      setAviso({ tipo: "erro", texto: erro });
      return;
    }
    await recarregar();
    setOcupado(false);
    setAviso({ tipo: "ok", texto: sucesso });
  };

  if (perfis === null) {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  // A tela não é a permissão: quem não é admin vê a rede pelo que o RLS
  // deixa, e as escritas abaixo são recusadas pelo banco. O aviso existe
  // para explicar, não para proteger.
  const semPermissao = perfis.length <= 1;

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 space-y-6">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Administração da rede
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Papéis, vínculos e escolas de toda a rede. Alterar papel e criar vínculo são operações
          exclusivas da administração do Ecosurf — o banco recusa de quem não é, mesmo que a tela
          mostre os botões.
        </p>
      </header>

      {aviso && (
        <div
          className={`p-3 rounded-sm text-xs flex items-start gap-2 border ${
            aviso.tipo === "erro"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {aviso.tipo === "erro" ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{aviso.texto}</span>
        </div>
      )}

      {semPermissao && (
        <div className="p-3 rounded-sm text-xs border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
          Você está vendo apenas o seu próprio perfil. A lista completa da rede é visível à
          administração do Ecosurf.
        </div>
      )}

      {/* Escolas */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Escolas · {escolas.length}
        </h2>

        <div className="bg-card border border-border rounded-md overflow-x-auto shadow-2xs">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/60">
              <tr className="border-b border-border text-left">
                <th className="py-2.5 px-3 font-semibold">Escola</th>
                <th className="py-2.5 px-3 font-semibold">No mapa</th>
                <th className="py-2.5 px-3 font-semibold">Termo de imagem</th>
                <th className="py-2.5 px-3 font-semibold w-24"></th>
              </tr>
            </thead>
            <tbody>
              {escolas.map((e) => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="py-2 px-3">
                    <span className="font-medium">{e.nome}</span>
                    <span className="block text-[10px] font-mono text-muted-foreground">
                      {e.slug}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-xs">
                    {e.publicada ? (
                      <span className="text-emerald-700 dark:text-emerald-400">publicada</span>
                    ) : (
                      <span className="text-muted-foreground">fora do ar</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs">
                    {e.termos_ok ? (
                      <span className="text-emerald-700 dark:text-emerald-400">registrado</span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">pendente</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <Link
                      href={`/escola/${e.slug}/editar`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pessoas */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <Users className="w-4 h-4" />
          Pessoas · {perfis.length}
        </h2>

        <div className="space-y-2">
          {perfis.map((p) => (
            <div
              key={p.id}
              className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-sm font-bold">{p.nome}</span>
                  <span className="block text-[10px] font-mono text-muted-foreground truncate">
                    {p.id}
                  </span>
                </div>

                <select
                  value={p.papel}
                  onChange={(e) =>
                    agir(
                      () => definirPapel(p.id, e.target.value as Papel),
                      `${p.nome} agora é ${
                        PAPEIS.find((x) => x.id === e.target.value)?.nome ?? e.target.value
                      }.`
                    )
                  }
                  disabled={ocupado}
                  className="px-3 py-2 text-sm bg-background border border-input rounded-sm shrink-0 disabled:opacity-50"
                >
                  {PAPEIS.map((papel) => (
                    <option key={papel.id} value={papel.id}>
                      {papel.nome}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {PAPEIS.find((x) => x.id === p.papel)?.descricao}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Responde por
                </span>

                {p.escolas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma escola. Sem vínculo, não enxerga expedição nem ficha de escola alguma.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {p.escolas.map((e) => (
                      <span
                        key={e.id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-secondary rounded-sm"
                      >
                        {e.nome}
                        <button
                          type="button"
                          onClick={() =>
                            agir(
                              () => removerVinculo(p.id, e.id),
                              `${p.nome} não responde mais por ${e.nome}.`
                            )
                          }
                          disabled={ocupado}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                          aria-label={`Remover vínculo com ${e.nome}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <select
                    value={vinculando[p.id] ?? ""}
                    onChange={(e) =>
                      setVinculando((prev) => ({
                        ...prev,
                        [p.id]: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="flex-1 px-3 py-1.5 text-xs bg-background border border-input rounded-sm"
                  >
                    <option value="">Vincular a uma escola…</option>
                    {escolas
                      .filter((e) => !p.escolas.some((pe) => pe.id === e.id))
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const escolaId = vinculando[p.id];
                      if (escolaId === "" || escolaId === undefined) return;
                      agir(() => criarVinculo(p.id, escolaId), "Vínculo criado.").then(() =>
                        setVinculando((prev) => ({ ...prev, [p.id]: "" }))
                      );
                    }}
                    disabled={ocupado || !vinculando[p.id]}
                    className="px-3 py-1.5 text-xs font-semibold bg-accent text-accent-foreground rounded-sm disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {ocupado ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Vincular
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          A pessoa precisa ter criado conta na plataforma para aparecer aqui — o perfil nasce no
          primeiro acesso. O e-mail não é exibido: ele vive na camada de autenticação, fora do
          alcance da aplicação.
        </p>
      </section>
    </main>
  );
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <AdminConteudo />
      </RotaProtegida>
    </div>
  );
}
