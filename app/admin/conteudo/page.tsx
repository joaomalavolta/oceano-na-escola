"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileText,
  ListChecks,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  School,
  ShieldAlert,
  Users,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { Voltar, VoltarRodape } from "@/components/navegacao/voltar";
import { Excluir } from "@/components/super/confirmar";
import { IconeBadge, GLIFOS_DISPONIVEIS, slugDe } from "@/components/mapa/icones";
import { NOME_DA_ETAPA } from "@/components/expedicoes/regua-de-etapas";
import {
  listarEscolasAdministraveis,
  listarPerfisDaRede,
  PAPEIS,
  type EscolaDaRede,
  type PerfilDaRede,
} from "@/lib/administracao";
import type { Etapa } from "@/lib/revisao";
import {
  criarItem,
  editarOcorrencia,
  excluirEscola,
  excluirItem,
  excluirOcorrencia,
  excluirSaida,
  excluirTexto,
  listarOcorrencias,
  listarProtocolosEditaveis,
  listarSaidas,
  listarTextos,
  removerContaComTrabalho,
  salvarItem,
  souSuper,
  type ItemEditavel,
  type OcorrenciaDaRede,
  type ProtocoloEditavel,
  type Resultado,
  type SaidaDaRede,
  type TextoDaRede,
} from "@/lib/super";
import { useSessao } from "@/lib/sessao";

type Aba = "escolas" | "pessoas" | "saidas" | "pinos" | "textos" | "itens";

const ABAS: { id: Aba; nome: string; Icone: typeof School }[] = [
  { id: "escolas", nome: "Escolas", Icone: School },
  { id: "pessoas", nome: "Pessoas", Icone: Users },
  { id: "saidas", nome: "Saídas", Icone: Compass },
  { id: "pinos", nome: "Pinos", Icone: MapPin },
  { id: "textos", nome: "Mural e histórias", Icone: FileText },
  { id: "itens", nome: "Itens dos protocolos", Icone: ListChecks },
];

const dia = (iso: string) => (iso ? new Date(iso.length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString("pt-BR") : "");
const etapa = (s: string) => NOME_DA_ETAPA[s as Etapa] ?? s;
const cartao = "bg-card border border-border rounded-md p-3 shadow-2xs";
const busca = "w-full px-3 py-2 text-sm bg-background border border-input rounded-sm";

/**
 * Central de conteúdo da super administração.
 *
 * Tudo da rede num lugar, para editar e excluir. A tela só aparece para
 * quem é super administrador, e o banco confere de novo em cada
 * exclusão grande (escola, conta com trabalho).
 */
function CentralConteudo() {
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [aba, setAba] = useState<Aba>("escolas");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    let ativo = true;
    souSuper().then((s) => ativo && setPermitido(s));
    return () => {
      ativo = false;
    };
  }, []);

  /** Mostra o resultado de uma ação e diz se deu certo. */
  const avisar = useCallback((r: Resultado, ok: string): boolean => {
    if (r.erro) {
      setAviso({ tipo: "erro", texto: r.erro });
      return false;
    }
    setAviso({ tipo: r.aviso ? "erro" : "ok", texto: r.aviso ?? ok });
    return true;
  }, []);

  if (permitido === null) {
    return (
      <main className="flex-1 flex items-center justify-center p-12 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Conferindo o acesso…
      </main>
    );
  }
  if (!permitido) {
    return (
      <main className="flex-1 max-w-xl mx-auto p-8 text-center space-y-2">
        <ShieldAlert className="w-8 h-8 mx-auto text-muted-foreground" />
        <p className="text-sm font-semibold">Área da super administração</p>
        <p className="text-xs text-muted-foreground">
          Esta tela exclui escolas, contas e conteúdo de toda a rede, e só abre para quem é super
          administrador.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-4">
      <Voltar href="/admin" texto="Voltar à Administração" />
      <header className="border-b border-border pb-3">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          Central de conteúdo
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          Editar e excluir qualquer conteúdo da rede. <strong className="text-foreground">Excluir é
          definitivo</strong>: não há lixeira, e o que estava publicado sai do mapa, da linha do
          tempo e dos dados abertos na hora. As fotos ligadas ao que é excluído também são
          apagadas do armazenamento.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1.5">
        {ABAS.map(({ id, nome, Icone }) => (
          <button
            key={id}
            onClick={() => {
              setAba(id);
              setAviso(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm border ${
              aba === id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
            }`}
          >
            <Icone className="w-3.5 h-3.5" />
            {nome}
          </button>
        ))}
      </nav>

      {aviso && (
        <p
          className={`p-3 rounded-sm text-xs flex items-start gap-2 border ${
            aviso.tipo === "erro"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {aviso.tipo === "erro" ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {aviso.texto}
        </p>
      )}

      {aba === "escolas" && <AbaEscolas avisar={avisar} />}
      {aba === "pessoas" && <AbaPessoas avisar={avisar} />}
      {aba === "saidas" && <AbaSaidas avisar={avisar} />}
      {aba === "pinos" && <AbaPinos avisar={avisar} />}
      {aba === "textos" && <AbaTextos avisar={avisar} />}
      {aba === "itens" && <AbaItens avisar={avisar} />}
      <VoltarRodape href="/admin" texto="Voltar à Administração" />
    </main>
  );
}

type Avisar = (r: Resultado, ok: string) => boolean;

/** Carrega uma lista e devolve o recarregar. */
function useLista<T>(carregar: () => Promise<T[]>) {
  const [lista, setLista] = useState<T[] | null>(null);
  const recarregar = useCallback(async () => setLista(await carregar()), [carregar]);
  useEffect(() => {
    let ativo = true;
    carregar().then((l) => ativo && setLista(l));
    return () => {
      ativo = false;
    };
  }, [carregar]);
  return { lista, recarregar };
}

function Carregando() {
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
    </p>
  );
}

function filtrar<T>(lista: T[] | null, termo: string, texto: (x: T) => string): T[] {
  const t = termo.trim().toLowerCase();
  return (lista ?? []).filter((x) => t === "" || texto(x).toLowerCase().includes(t));
}

// ── Escolas ───────────────────────────────────────────────────────────

function AbaEscolas({ avisar }: { avisar: Avisar }) {
  const { lista, recarregar } = useLista<EscolaDaRede>(listarEscolasAdministraveis);
  const [termo, setTermo] = useState("");
  if (!lista) return <Carregando />;
  const itens = filtrar(lista, termo, (e) => e.nome);
  return (
    <section className="space-y-2">
      <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar escola…" className={busca} />
      {itens.map((e) => (
        <div key={e.id} className={`${cartao} flex flex-wrap items-center gap-x-4 gap-y-1`}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{e.nome}</p>
            <p className="text-[11px] text-muted-foreground">
              {e.tipo === "surf" ? "Escola de surf" : "Escola"} · {e.situacao} · {e.publicada ? "publicada" : "fora do mapa"} ·
              desde {dia(e.criado_em)}
            </p>
          </div>
          <Link href={`/escola/${e.slug}/editar`} className="text-xs font-semibold text-primary inline-flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Link>
          <Link href={`/escola/${e.slug}`} className="text-xs font-semibold text-primary inline-flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> Página
          </Link>
          <Excluir
            aviso={`Excluir "${e.nome}" apaga a escola e tudo o que é dela: turmas, saídas, ocorrências, contagens, fotos, mural, histórias, coordenação, vínculos e convites. Some do mapa e dos dados abertos. Não tem volta.`}
            digitar={e.nome}
            aoConfirmar={async (nome) => {
              if (avisar(await excluirEscola(e.id, nome), `A escola "${e.nome}" foi excluída.`)) await recarregar();
            }}
          />
        </div>
      ))}
    </section>
  );
}

// ── Pessoas ───────────────────────────────────────────────────────────

function AbaPessoas({ avisar }: { avisar: Avisar }) {
  const { session } = useSessao();
  const { lista, recarregar } = useLista<PerfilDaRede>(listarPerfisDaRede);
  const [termo, setTermo] = useState("");
  if (!lista) return <Carregando />;
  const itens = filtrar(lista, termo, (p) => `${p.nome} ${p.conta?.email ?? ""}`);
  return (
    <section className="space-y-2">
      <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar pessoa ou e-mail…" className={busca} />
      <p className="text-[11px] text-muted-foreground">
        Papel e vínculo com escola se ajustam na <Link href="/admin" className="text-primary">Administração</Link>.
        Aqui a conta sai de vez — mesmo com trabalho registrado: as saídas, fotos e textos dela
        ficam, sem autor.
      </p>
      {itens.map((p) => (
        <div key={p.id} className={`${cartao} flex flex-wrap items-center gap-x-4 gap-y-1`}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{p.nome}</p>
            <p className="text-[11px] text-muted-foreground break-all">
              {p.conta?.email ?? "e-mail indisponível"} · {PAPEIS.find((x) => x.id === p.papel)?.nome ?? p.papel}
              {p.escolas.length > 0 && ` · ${p.escolas.map((e) => e.nome).join(", ")}`}
            </p>
          </div>
          {p.id === session?.user.id ? (
            <span className="text-[11px] text-muted-foreground">sua conta</span>
          ) : (
            <Excluir
              rotulo="Excluir conta"
              aviso={`A conta de ${p.nome} sai de vez: a pessoa perde o acesso e precisará de convite novo para voltar. O que ela registrou fica na plataforma, sem autor.`}
              digitar={p.nome}
              aoConfirmar={async () => {
                if (avisar(await removerContaComTrabalho(p.id), `A conta de ${p.nome} foi excluída.`)) await recarregar();
              }}
            />
          )}
        </div>
      ))}
    </section>
  );
}

// ── Saídas ────────────────────────────────────────────────────────────

function AbaSaidas({ avisar }: { avisar: Avisar }) {
  const { lista, recarregar } = useLista<SaidaDaRede>(listarSaidas);
  const [termo, setTermo] = useState("");
  if (!lista) return <Carregando />;
  const itens = filtrar(lista, termo, (x) => `${x.escola_nome} ${x.titulo ?? ""} #${x.numero}`);
  return (
    <section className="space-y-2">
      <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por escola ou título…" className={busca} />
      {itens.map((x) => (
        <div key={x.id} className={`${cartao} flex flex-wrap items-center gap-x-4 gap-y-1`}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              #{x.numero} · {x.titulo ?? "Sem título"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {x.escola_nome} · {dia(x.data_campo)} · {etapa(x.status)} · {x.ocorrencias} ocorrência(s)
            </p>
          </div>
          <Link href={`/expedicoes/${x.id}`} className="text-xs font-semibold text-primary inline-flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" /> Abrir
          </Link>
          <Excluir
            aviso={`Excluir a saída #${x.numero} de ${x.escola_nome} apaga as ocorrências, as contagens da ficha, o diário e as fotos dela. Se estava publicada, sai do mapa.`}
            aoConfirmar={async () => {
              if (avisar(await excluirSaida(x.id), `A saída #${x.numero} foi excluída.`)) await recarregar();
            }}
          />
        </div>
      ))}
    </section>
  );
}

// ── Pinos ─────────────────────────────────────────────────────────────

function AbaPinos({ avisar }: { avisar: Avisar }) {
  const { lista, recarregar } = useLista<OcorrenciaDaRede>(listarOcorrencias);
  const [termo, setTermo] = useState("");
  const [editando, setEditando] = useState<{ id: number; descricao: string; valor: string; origem: string } | null>(null);
  if (!lista) return <Carregando />;
  const itens = filtrar(lista, termo, (o) => `${o.escola_nome} ${o.protocolo} ${o.item ?? ""} ${o.descricao}`);
  return (
    <section className="space-y-2">
      <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por escola, protocolo, item ou descrição…" className={busca} />
      <p className="text-[11px] text-muted-foreground">{itens.length} de {lista.length} ocorrência(s)</p>
      {itens.map((o) => (
        <div key={o.id} className={cartao}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <IconeBadge slug={slugDe(o.item_icone, o.icone)} cor={o.cor} tamanho={26} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                <span className="font-mono text-[11px] text-muted-foreground">{o.protocolo}</span> {o.item ?? o.descricao}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {o.escola_nome} · saída #{o.expedicao_numero} · {dia(o.data_campo)} · {etapa(o.status)}
                {o.valor !== null && ` · ${o.valor} ${o.unidade ?? ""}`}
                {o.fotos > 0 && ` · ${o.fotos} foto(s)`}
              </p>
              {o.item && <p className="text-[11px]">{o.descricao}</p>}
            </div>
            <button
              onClick={() =>
                setEditando({ id: o.id, descricao: o.descricao, valor: o.valor === null ? "" : String(o.valor), origem: o.origem_provavel ?? "" })
              }
              className="text-xs font-semibold text-primary inline-flex items-center gap-1"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <Link href={`/expedicoes/${o.expedicao_id}/revisar`} className="text-xs font-semibold text-primary">
              Na revisão
            </Link>
            <Excluir
              aviso={`Excluir este pino apaga a ocorrência${o.fotos > 0 ? ` e as ${o.fotos} foto(s) dela` : ""}. Se a saída está publicada, ele sai do mapa na hora.`}
              aoConfirmar={async () => {
                if (avisar(await excluirOcorrencia(o.id), "O pino foi excluído.")) await recarregar();
              }}
            />
          </div>
          {editando?.id === o.id && (
            <div className="mt-2 pt-2 border-t border-border grid sm:grid-cols-3 gap-2">
              <textarea
                value={editando.descricao}
                onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                rows={2}
                className={`${busca} sm:col-span-3`}
                aria-label="Descrição"
              />
              <input
                value={editando.valor}
                onChange={(e) => setEditando({ ...editando, valor: e.target.value })}
                placeholder={`Magnitude${o.unidade ? ` (${o.unidade})` : ""}`}
                inputMode="decimal"
                className={busca}
              />
              <input
                value={editando.origem}
                onChange={(e) => setEditando({ ...editando, origem: e.target.value })}
                placeholder="Origem provável"
                className={busca}
              />
              <div className="flex gap-2">
                <button onClick={() => setEditando(null)} className="flex-1 px-3 py-2 text-xs font-semibold border border-border rounded-sm">
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const v = editando.valor.trim().replace(",", ".");
                    const ok = avisar(
                      await editarOcorrencia(o.id, {
                        descricao: editando.descricao,
                        valor: v === "" ? null : Number(v),
                        origem_provavel: editando.origem,
                      }),
                      "Ocorrência atualizada."
                    );
                    if (ok) {
                      setEditando(null);
                      await recarregar();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-sm"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

// ── Mural e histórias ─────────────────────────────────────────────────

function AbaTextos({ avisar }: { avisar: Avisar }) {
  const { lista, recarregar } = useLista<TextoDaRede>(listarTextos);
  const [termo, setTermo] = useState("");
  if (!lista) return <Carregando />;
  const itens = filtrar(lista, termo, (t) => `${t.escola_nome} ${t.titulo}`);
  return (
    <section className="space-y-2">
      <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar…" className={busca} />
      <p className="text-[11px] text-muted-foreground">
        Fotos avulsas da galeria se excluem na <Link href="/galeria" className="text-primary">Galeria</Link>; as histórias
        se editam em <Link href="/historias" className="text-primary">Histórias</Link>.
      </p>
      {itens.map((t) => (
        <div key={`${t.tipo}-${t.id}`} className={`${cartao} flex flex-wrap items-center gap-x-4 gap-y-1`}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t.titulo}</p>
            <p className="text-[11px] text-muted-foreground">
              {t.tipo === "mural" ? "Mural" : "História"} · {t.escola_nome} · {dia(t.criado_em)} ·{" "}
              {t.publicada ? "publicada" : "não publicada"}
            </p>
          </div>
          <Excluir
            aviso={
              t.tipo === "mural"
                ? "Excluir esta publicação do mural apaga o texto e as fotos e vídeos dela, e a tira da linha do tempo."
                : "Excluir esta história apaga o texto. As saídas e fotos ligadas a ela continuam."
            }
            aoConfirmar={async () => {
              if (avisar(await excluirTexto(t), "Excluído.")) await recarregar();
            }}
          />
        </div>
      ))}
    </section>
  );
}

// ── Itens dos protocolos ──────────────────────────────────────────────

function AbaItens({ avisar }: { avisar: Avisar }) {
  const { lista, recarregar } = useLista<ProtocoloEditavel>(listarProtocolosEditaveis);
  const [editando, setEditando] = useState<ItemEditavel | null>(null);
  const [novo, setNovo] = useState<{ versao: number; nome: string; grupo: string; unidade: string } | null>(null);
  const glifos = useMemo(() => GLIFOS_DISPONIVEIS, []);
  if (!lista) return <Carregando />;
  return (
    <section className="space-y-4">
      <p className="text-[11px] text-muted-foreground max-w-3xl">
        Renomear um item muda o nome dele em todos os registros já feitos com ele — inclusive os
        publicados. Use para corrigir, não para trocar o sentido do item: item com sentido novo
        entra como item novo. Item já usado não pode ser excluído.
      </p>
      {lista.map((p) => (
        <div key={p.versao_id} className="bg-card border border-border rounded-md shadow-2xs">
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <IconeBadge slug={p.icone} cor={p.cor} tamanho={22} />
            <p className="text-sm font-bold">
              <span className="font-mono">{p.codigo}</span> · {p.nome}
            </p>
            <span className="text-[11px] text-muted-foreground">versão {p.versao}</span>
          </div>
          <ul className="divide-y divide-border">
            {p.itens.map((i) =>
              editando?.id === i.id ? (
                <li key={i.id} className="p-3 grid sm:grid-cols-4 gap-2">
                  <input value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} className={`${busca} sm:col-span-2`} aria-label="Nome" />
                  <input value={editando.grupo} onChange={(e) => setEditando({ ...editando, grupo: e.target.value })} className={busca} aria-label="Grupo" placeholder="Grupo" />
                  <input value={editando.unidade ?? ""} onChange={(e) => setEditando({ ...editando, unidade: e.target.value })} className={busca} aria-label="Unidade" placeholder="Unidade" />
                  <div className="sm:col-span-4 flex flex-wrap items-center gap-2">
                    <IconeBadge slug={editando.icone ?? p.icone} cor={p.cor} tamanho={26} />
                    <select
                      value={editando.icone ?? ""}
                      onChange={(e) => setEditando({ ...editando, icone: e.target.value || null })}
                      className="px-2 py-1.5 text-xs bg-background border border-input rounded-sm"
                      aria-label="Ícone"
                    >
                      <option value="">Ícone do protocolo</option>
                      {glifos.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <span className="flex-1" />
                    <button onClick={() => setEditando(null)} className="px-3 py-1.5 text-xs font-semibold border border-border rounded-sm">Cancelar</button>
                    <button
                      onClick={async () => {
                        if (avisar(await salvarItem(i.id, editando), "Item atualizado.")) {
                          setEditando(null);
                          await recarregar();
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-sm"
                    >
                      Salvar
                    </button>
                  </div>
                </li>
              ) : (
                <li key={i.id} className="px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <IconeBadge slug={i.icone ?? p.icone} cor={p.cor} tamanho={22} />
                  <span className="font-mono text-[11px] text-muted-foreground w-12">{i.codigo}</span>
                  <span className="flex-1 min-w-0 text-sm">
                    {i.nome}
                    <span className="text-[11px] text-muted-foreground"> · {i.grupo}{i.unidade ? ` · ${i.unidade}` : ""}</span>
                  </span>
                  <button onClick={() => setEditando(i)} className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                  <Excluir
                    aviso="Excluir o item. Só funciona se ele nunca foi usado em nenhum registro."
                    aoConfirmar={async () => {
                      if (avisar(await excluirItem(i.id), "Item excluído.")) await recarregar();
                    }}
                  />
                </li>
              )
            )}
          </ul>
          <div className="px-3 py-2 border-t border-border">
            {novo?.versao === p.versao_id ? (
              <div className="grid sm:grid-cols-4 gap-2">
                <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome do item" className={`${busca} sm:col-span-2`} />
                <input value={novo.grupo} onChange={(e) => setNovo({ ...novo, grupo: e.target.value })} placeholder="Grupo" className={busca} />
                <input value={novo.unidade} onChange={(e) => setNovo({ ...novo, unidade: e.target.value })} placeholder="Unidade (opcional)" className={busca} />
                <div className="sm:col-span-4 flex justify-end gap-2">
                  <button onClick={() => setNovo(null)} className="px-3 py-1.5 text-xs font-semibold border border-border rounded-sm">Cancelar</button>
                  <button
                    onClick={async () => {
                      if (avisar(await criarItem(p, { nome: novo.nome, grupo: novo.grupo, unidade: novo.unidade || null }), "Item criado.")) {
                        setNovo(null);
                        await recarregar();
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-sm"
                  >
                    Criar item
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setNovo({ versao: p.versao_id, nome: "", grupo: p.itens[0]?.grupo ?? "", unidade: p.itens[0]?.unidade ?? "" })}
                className="text-xs font-semibold text-primary inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Novo item em {p.codigo}
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function CentralDeConteudoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <CentralConteudo />
      </RotaProtegida>
    </div>
  );
}
