"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Inbox,
  Loader2,
  Mail,
  MapPinOff,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  X,
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
  aprovarEscola,
  recusarEscola,
  esperaDesde,
  PAPEIS,
  type PerfilDaRede,
  type Papel,
  type EscolaDaRede,
} from "@/lib/administracao";
import {
  listarConvites,
  criarConvite,
  revogarConvite,
  situacaoDoConvite,
  type Convite,
} from "@/lib/convites";

/** O link que o Ecosurf manda para a pessoa convidada. */
function linkDoConvite(token: string): string {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return `${base}/convite/${token}`;
}

function formatarDia(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function AdminConteudo() {
  const [perfis, setPerfis] = useState<PerfilDaRede[] | null>(null);
  const [escolas, setEscolas] = useState<EscolaDaRede[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [vinculando, setVinculando] = useState<Record<string, number | "">>({});
  // Qual cadastro está com o campo de motivo aberto, e o que já foi
  // escrito nele. Recusar sem motivo é recusa que a escola não tem como
  // responder, então o motivo é passo, não caixa de diálogo.
  const [recusando, setRecusando] = useState<{ id: number; motivo: string } | null>(null);

  const [convites, setConvites] = useState<Convite[]>([]);
  const [novoConvite, setNovoConvite] = useState({
    email: "",
    papel: "professor" as Papel,
    escolaId: "" as number | "",
    mensagem: "",
    dias: 14,
  });
  // O link recém-criado fica à vista até o próximo convite: é a única
  // vez em que ele aparece sem precisar procurar na lista, e é agora
  // que o Ecosurf vai copiá-lo para mandar.
  const [linkNovo, setLinkNovo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const recarregar = async () => {
    const [ps, es, cs] = await Promise.all([
      listarPerfisDaRede(),
      listarEscolasAdministraveis(),
      listarConvites(),
    ]);
    setPerfis(ps);
    setEscolas(es);
    setConvites(cs);
  };

  useEffect(() => {
    let ativo = true;
    Promise.all([listarPerfisDaRede(), listarEscolasAdministraveis(), listarConvites()]).then(
      ([ps, es, cs]) => {
        if (!ativo) return;
        setPerfis(ps);
        setEscolas(es);
        setConvites(cs);
      }
    );
    return () => {
      ativo = false;
    };
  }, []);

  const copiar = async (texto: string, chave: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // Área de transferência negada — em http sem TLS, por exemplo. O
      // link continua visível e selecionável na tela, que é o que
      // importa: a cópia é atalho, não é o caminho.
      setAviso({ tipo: "erro", texto: "Não consegui copiar. Selecione o link e copie à mão." });
    }
  };

  const enviarConvite = async () => {
    setOcupado(true);
    setAviso(null);
    setLinkNovo(null);
    const { token, erro } = await criarConvite(
      novoConvite.email,
      novoConvite.papel,
      novoConvite.escolaId === "" ? null : novoConvite.escolaId,
      novoConvite.mensagem,
      novoConvite.dias
    );
    if (erro || !token) {
      setOcupado(false);
      setAviso({ tipo: "erro", texto: erro ?? "Não foi possível criar o convite." });
      return;
    }
    await recarregar();
    setOcupado(false);
    setLinkNovo(linkDoConvite(token));
    setNovoConvite((p) => ({ ...p, email: "", mensagem: "" }));
    setAviso({ tipo: "ok", texto: "Convite criado. Copie o link e mande para a pessoa." });
  };

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
  const pendentes = escolas.filter((e) => e.situacao === "pendente");
  const convitesAbertos = convites.filter((c) => situacaoDoConvite(c) === "aberto");

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 space-y-6">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Administração da rede
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          Análise de cadastro, papéis, vínculos e escolas de toda a rede. Aprovar cadastro,
          alterar papel e criar vínculo são operações exclusivas da administração do Ecosurf — o
          banco recusa de quem não é, mesmo que a tela mostre os botões.
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

      {/* Fila de análise. Vem antes de tudo porque é a única parte
          desta tela que é trabalho a fazer: o resto é consulta. */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <Inbox className="w-4 h-4" />
          Cadastros à espera de análise · {pendentes.length}
        </h2>

        {pendentes.length === 0 ? (
          <p className="text-xs text-muted-foreground bg-card border border-border rounded-md p-4">
            Nenhum cadastro esperando. Escola nova entra aqui assim que alguém a cadastra, e só
            vai ao mapa da rede depois que você aprovar.
          </p>
        ) : (
          <div className="space-y-2">
            {pendentes.map((e) => (
              <div
                key={e.id}
                className="bg-card border-l-4 border-l-accent border border-border rounded-md p-4 shadow-2xs space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-bold">{e.nome}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {esperaDesde(e.criado_em)}
                      {" · "}
                      <span className="font-mono">{e.slug}</span>
                      {" · termo de imagem "}
                      {e.termos_ok ? "registrado" : "pendente"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/escola/${e.slug}/editar`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary"
                    >
                      <Pencil className="w-3 h-3" />
                      Conferir a ficha
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setRecusando((r) => (r?.id === e.id ? null : { id: e.id, motivo: "" }))
                      }
                      disabled={ocupado}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                      Recusar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        agir(() => aprovarEscola(e.id), `${e.nome} entrou no mapa da rede.`)
                      }
                      disabled={ocupado || !e.temCoordenada}
                      title={
                        e.temCoordenada
                          ? undefined
                          : "Sem coordenada a escola não aparece no mapa, mesmo aprovada."
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-accent text-accent-foreground rounded-sm disabled:opacity-50"
                    >
                      {ocupado ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Aprovar
                    </button>
                  </div>
                </div>

                {!e.temCoordenada && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                    <MapPinOff className="w-3.5 h-3.5 shrink-0 mt-px" />
                    Esta escola ainda não tem coordenada. Sem posição ela não aparece no mapa,
                    mesmo aprovada — abra a ficha e marque onde ela fica antes de aprovar.
                  </p>
                )}

                {recusando?.id === e.id && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Motivo da recusa
                    </label>
                    <textarea
                      rows={2}
                      autoFocus
                      value={recusando.motivo}
                      onChange={(ev) =>
                        setRecusando((r) => (r ? { ...r, motivo: ev.target.value } : r))
                      }
                      placeholder="O que a escola precisa corrigir para reenviar."
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      A escola lê este texto na ficha dela e pode corrigir e reenviar. Ele não
                      aparece em página pública.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRecusando(null)}
                        className="px-3 py-1.5 text-xs font-semibold border border-border rounded-sm hover:bg-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          agir(
                            () => recusarEscola(e.id, recusando.motivo),
                            `Cadastro de ${e.nome} recusado. A escola já vê o motivo.`
                          ).then(() => setRecusando(null))
                        }
                        disabled={ocupado || recusando.motivo.trim() === ""}
                        className="px-3 py-1.5 text-xs font-semibold bg-destructive text-white rounded-sm disabled:opacity-50"
                      >
                        Confirmar recusa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Convites — a outra porta de entrada.

          A fila acima é quem chegou sozinho; esta seção é quem o
          Ecosurf foi buscar. Quem entra por convite não passa pela
          fila: o convite é a aprovação, dada antes, e por isso ele já
          carrega o papel e a escola. */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Convites · {convitesAbertos.length} em aberto
        </h2>

        <div className="bg-card border border-border rounded-md p-4 shadow-2xs space-y-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            O convite vale para <strong className="text-foreground">um e-mail só</strong>: quem
            abrir o link com outro endereço é recusado pelo banco. Quem aceita entra já com o
            papel e a escola definidos aqui, sem passar pela fila de análise.
          </p>

          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                E-mail de quem você quer convidar
              </label>
              <input
                type="email"
                value={novoConvite.email}
                onChange={(e) => setNovoConvite((p) => ({ ...p, email: e.target.value }))}
                placeholder="professora@escola.sp.gov.br"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Entra como
              </label>
              <select
                value={novoConvite.papel}
                onChange={(e) =>
                  setNovoConvite((p) => ({ ...p, papel: e.target.value as Papel }))
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
              >
                {PAPEIS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Vinculada a uma escola
              </label>
              <select
                value={novoConvite.escolaId}
                onChange={(e) =>
                  setNovoConvite((p) => ({
                    ...p,
                    escolaId: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
              >
                <option value="">Nenhuma por enquanto</option>
                {escolas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Sem escola, quem for convidado como professor cai direto no cadastro da dele.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Vale por (dias)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={novoConvite.dias}
                onChange={(e) =>
                  setNovoConvite((p) => ({ ...p, dias: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 text-sm tabular-nums bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Recado (aparece na página do convite)
            </label>
            <textarea
              rows={2}
              value={novoConvite.mensagem}
              onChange={(e) => setNovoConvite((p) => ({ ...p, mensagem: e.target.value }))}
              placeholder="Quem está convidando e por quê. Link sem contexto parece golpe."
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            type="button"
            onClick={enviarConvite}
            disabled={ocupado || novoConvite.email.trim() === ""}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {ocupado ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            Criar convite
          </button>

          {/* O link não é enviado por nós: a plataforma não manda e-mail
              ainda, e prometer envio que não acontece seria pior que
              pedir para copiar. */}
          {linkNovo && (
            <div className="p-3 rounded-sm border border-primary/40 bg-primary/5 space-y-2">
              <p className="text-[11px] font-semibold">
                Mande este link para a pessoa. Ele não é enviado automaticamente.
              </p>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  readOnly
                  value={linkNovo}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-background border border-input rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => copiar(linkNovo, "novo")}
                  className="px-3 py-2 text-xs font-semibold border border-border rounded-sm hover:bg-secondary inline-flex items-center justify-center gap-1.5"
                >
                  {copiado === "novo" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiado === "novo" ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>

        {convites.length > 0 && (
          <div className="bg-card border border-border rounded-md overflow-x-auto shadow-2xs">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left">
                  <th className="py-2.5 px-3 font-semibold">Convidado</th>
                  <th className="py-2.5 px-3 font-semibold">Entra como</th>
                  <th className="py-2.5 px-3 font-semibold">Situação</th>
                  <th className="py-2.5 px-3 font-semibold w-44"></th>
                </tr>
              </thead>
              <tbody>
                {convites.map((c) => {
                  const situacao = situacaoDoConvite(c);
                  return (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-2 px-3">
                        <span className="font-medium break-all">{c.email}</span>
                        {c.escola_nome && (
                          <span className="block text-[10px] text-muted-foreground">
                            {c.escola_nome}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {PAPEIS.find((p) => p.id === c.papel)?.nome ?? c.papel}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {situacao === "aberto" && (
                          <span className="text-acento-texto font-semibold">
                            aberto até {formatarDia(c.expira_em)}
                          </span>
                        )}
                        {situacao === "resgatado" && (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            aceito em {formatarDia(c.resgatado_em!)}
                          </span>
                        )}
                        {situacao === "revogado" && (
                          <span className="text-muted-foreground">cancelado</span>
                        )}
                        {situacao === "expirado" && (
                          <span className="text-muted-foreground">
                            venceu em {formatarDia(c.expira_em)}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {situacao === "aberto" && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copiar(linkDoConvite(c.token), `c${c.id}`)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              {copiado === `c${c.id}` ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              {copiado === `c${c.id}` ? "Copiado" : "Copiar link"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                agir(
                                  () => revogarConvite(c.id),
                                  `Convite para ${c.email} cancelado.`
                                )
                              }
                              disabled={ocupado}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                            >
                              <X className="w-3 h-3" />
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                <th className="py-2.5 px-3 font-semibold">Cadastro</th>
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
                  {/* Cadastro e mapa são colunas separadas porque são
                      coisas separadas: a escola aprovada que tira a
                      própria página do ar continua aprovada. */}
                  <td className="py-2 px-3 text-xs">
                    {e.situacao === "aprovada" && (
                      <span className="text-emerald-700 dark:text-emerald-400">aprovado</span>
                    )}
                    {e.situacao === "pendente" && (
                      <span className="text-acento-texto font-semibold">em análise</span>
                    )}
                    {e.situacao === "recusada" && (
                      <>
                        <span className="text-destructive font-semibold">recusado</span>
                        {e.motivo_recusa && (
                          <span className="block text-[10px] text-muted-foreground max-w-56">
                            {e.motivo_recusa}
                          </span>
                        )}
                      </>
                    )}
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
