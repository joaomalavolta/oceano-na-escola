"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CloudUpload,
  Image as ImageIcon,
  Crosshair,
  Loader2,
  MapPin,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { RotaProtegida } from "@/components/auth/rota-protegida";
import { EstadoContainer } from "@/components/ui/estado-container";
import { IconeBadge } from "@/components/mapa/icones";
import { Voltar, VoltarRodape } from "@/components/navegacao/voltar";
import {
  listarExpedicoesAbertas,
  listarProtocolosDeCampo,
  guardarCatalogo,
  catalogoGuardado,
  reduzirFoto,
  enviarRegistro,
  type ExpedicaoAberta,
  type ProtocoloDeCampo,
} from "@/lib/campo";
import {
  enfileirar,
  listarPendentes,
  removerPendente,
  type RegistroDeCampo,
  type RegistroPendente,
} from "@/lib/fila-campo";
import { listarSaidasEncerradasRecentes, type SaidaEncerrada } from "@/lib/saida-de-campo";
import { reabrirParaCorrecao } from "@/lib/revisao";
import { NOME_DA_ETAPA } from "@/components/expedicoes/regua-de-etapas";
import type { Etapa } from "@/lib/revisao";

/** A saída pedida no endereço (`/campo?expedicao=20`), vinda da página da saída. */
function saidaPedida(): number | null {
  if (typeof window === "undefined") return null;
  const n = Number(new URLSearchParams(window.location.search).get("expedicao"));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Qual saída já vem escolhida: a pedida, se estiver aberta; a única, se só houver uma. */
function escolhaInicial(lista: ExpedicaoAberta[]): number | null {
  const pedida = saidaPedida();
  if (pedida !== null && lista.some((x) => x.id === pedida)) return pedida;
  return lista.length === 1 ? lista[0].id : null;
}

interface Gps {
  lat: number;
  lng: number;
  /** Em metros, do GPS. Nula quando o ponto foi marcado à mão no mapa. */
  precisao: number | null;
}

/*
  O mapa só carrega quando é preciso, e sem SSR (o MapLibre exige o DOM).
  Se nem o código dele estiver no aparelho — na praia, sem sinal, num
  celular que nunca abriu o mapa —, a página segue com o botão de GPS em
  vez de quebrar inteira.
*/
const SeletorDePosicao = dynamic(
  () =>
    import("@/components/mapa/seletor-de-posicao")
      .then((m) => m.SeletorDePosicao)
      .catch(() => SemMapa),
  {
    ssr: false,
    loading: () => <div className="h-72 sm:h-80 rounded-sm border border-input bg-muted/40 animate-pulse" />,
  }
);

function SemMapa() {
  return (
    <p className="text-[11px] text-muted-foreground border border-dashed border-border rounded-sm p-3">
      O mapa não carregou neste aparelho (sem conexão?). Use o botão de GPS acima.
    </p>
  );
}

/** Erro de rede se guarda na fila; erro de regra se mostra. */
function pareceRede(mensagem: string): boolean {
  return /fetch|network|load failed|timeout/i.test(mensagem);
}

function CampoConteudo() {
  const [expedicoes, setExpedicoes] = useState<ExpedicaoAberta[] | null>(null);
  const [protocolos, setProtocolos] = useState<ProtocoloDeCampo[]>([]);
  const [pendentes, setPendentes] = useState<RegistroPendente[]>([]);

  const [expedicaoId, setExpedicaoId] = useState<number | null>(null);
  // Saídas recentes já enviadas: o que a tela oferece reabrir quando não
  // há saída aberta, em vez de só dizer "nenhuma expedição aberta".
  const [encerradas, setEncerradas] = useState<SaidaEncerrada[]>([]);
  const [reabrindo, setReabrindo] = useState<{ id: number; processando: boolean } | null>(null);
  const [erroReabrir, setErroReabrir] = useState<string | null>(null);
  const [protocolo, setProtocolo] = useState<ProtocoloDeCampo | null>(null);
  const [itemId, setItemId] = useState<number | null>(null);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [origem, setOrigem] = useState("");
  const [legenda, setLegenda] = useState("");

  const [gps, setGps] = useState<Gps | null>(null);
  const [capturando, setCapturando] = useState(false);
  const [erroGps, setErroGps] = useState<string | null>(null);

  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  // Dois campos de arquivo: com `capture`, o Android abre só a câmera e
  // não deixa escolher foto já tirada; sem ele, abre a galeria. O botão
  // dizia "tirar ou escolher" e só fazia a primeira coisa.
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const galeriaInputRef = useRef<HTMLInputElement>(null);

  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "ok" | "erro" | "fila";
    texto: string;
    link?: { href: string; rotulo: string };
  } | null>(null);

  /**
   * De quando é a lista na tela, quando ela veio do aparelho e não do
   * banco. `null` significa que veio do banco agora.
   */
  const [catalogoDe, setCatalogoDe] = useState<string | null>(null);
  /** Nem rede nem cópia local: não há como montar o formulário. */
  const [semCatalogo, setSemCatalogo] = useState(false);

  /** Trava contra duas descargas ao mesmo tempo, que duplicariam envio. */
  const descarregando = useRef(false);

  const reenviarPendentes = useCallback(async (automatico = false) => {
    if (descarregando.current) return;
    const fila = await listarPendentes();
    // No automático, silêncio quando não há nada: o aviso serviria só
    // para dizer que zero registros foram enviados.
    if (fila.length === 0 && automatico) return;

    descarregando.current = true;
    setReenviando(true);
    if (!automatico) setMensagem(null);

    let enviados = 0;
    let recusados = 0;
    for (const p of fila) {
      const { erro } = await enviarRegistro(p.registro, p.foto);
      if (erro) {
        // Rede caindo de novo: parar e tentar tudo mais tarde, na ordem.
        if (pareceRede(erro)) break;
        // Recusa do banco — a expedição já foi enviada, por exemplo, o
        // que fica provável agora que dá para registrar com a lista
        // guardada de dias atrás. Segue para o próximo em vez de parar:
        // um registro impossível não pode prender os outros vinte na
        // fila para sempre, como prendia.
        recusados += 1;
        continue;
      }
      await removerPendente(p.id);
      enviados += 1;
    }

    const restam = await listarPendentes();
    setPendentes(restam);
    setReenviando(false);
    descarregando.current = false;

    if (automatico && enviados === 0 && recusados === 0) return;
    if (recusados > 0) {
      setMensagem({
        tipo: "erro",
        texto: `${enviados} enviado(s). ${recusados} recusado(s) pelo sistema — confira se a expedição ainda está aberta.`,
      });
      return;
    }
    setMensagem(
      restam.length === 0
        ? { tipo: "ok", texto: `${enviados} registro(s) pendente(s) enviados.` }
        : { tipo: "erro", texto: `${enviados} enviado(s); ${restam.length} ainda na fila.` }
    );
  }, []);

  /**
   * O sinal voltou: a fila esvazia sozinha.
   *
   * Antes isso dependia de o professor voltar a esta página e apertar o
   * botão. Numa saída com vinte registros offline, é a diferença entre
   * o dado chegar ao banco e ficar parado no aparelho até alguém
   * lembrar — e quem esteve na praia o dia inteiro não lembra.
   */
  useEffect(() => {
    const aoVoltarARede = () => {
      void reenviarPendentes(true);
    };
    window.addEventListener("online", aoVoltarARede);
    return () => window.removeEventListener("online", aoVoltarARede);
  }, [reenviarPendentes]);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarExpedicoesAbertas(), listarProtocolosDeCampo(), listarPendentes()]).then(
      ([exps, protos, fila]) => {
        if (!ativo) return;
        setPendentes(fila);

        // O aparelho pode ter reconectado com o app fechado, e aí o
        // evento `online` aconteceu sem ninguém para ouvir. Esta é a
        // segunda chance da fila.
        if (fila.length > 0 && navigator.onLine) void reenviarPendentes(true);

        // Veio do banco: vale, e fica guardado para a próxima ida a
        // campo — inclusive uma sem sinal nenhum.
        if (exps && protos) {
          guardarCatalogo(exps, protos);
          setExpedicoes(exps);
          setProtocolos(protos);
          setExpedicaoId(escolhaInicial(exps));
          const pedida = saidaPedida();
          if (exps.length === 0 || (pedida !== null && !exps.some((x) => x.id === pedida))) {
            void listarSaidasEncerradasRecentes().then((l) => ativo && setEncerradas(l));
          }
          return;
        }

        // Não deu para perguntar. A cópia da última vez serve: o que
        // importa é o formulário existir para o registro entrar na fila.
        const memo = catalogoGuardado();
        if (memo) {
          setExpedicoes(memo.expedicoes);
          setProtocolos(memo.protocolos);
          setCatalogoDe(memo.em);
          setExpedicaoId(escolhaInicial(memo.expedicoes));
          return;
        }

        setExpedicoes([]);
        setSemCatalogo(true);
      }
    );
    return () => {
      ativo = false;
    };
  }, [reenviarPendentes]);

  /** Devolve a saída a rascunho e já a deixa escolhida para registrar. */
  const reabrir = async (id: number) => {
    setReabrindo({ id, processando: true });
    setErroReabrir(null);
    const { erro } = await reabrirParaCorrecao(id);
    if (erro) {
      setReabrindo(null);
      setErroReabrir(erro);
      return;
    }
    const [exps, protos, fechadas] = await Promise.all([
      listarExpedicoesAbertas(),
      listarProtocolosDeCampo(),
      listarSaidasEncerradasRecentes(),
    ]);
    if (exps && protos) {
      guardarCatalogo(exps, protos);
      setExpedicoes(exps);
      setProtocolos(protos);
    }
    setEncerradas(fechadas);
    setExpedicaoId(id);
    setReabrindo(null);
  };

  const capturarGps = () => {
    if (!("geolocation" in navigator)) {
      setErroGps("Este aparelho não oferece geolocalização.");
      return;
    }
    setCapturando(true);
    setErroGps(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precisao: Math.round(pos.coords.accuracy),
        });
        setCapturando(false);
      },
      (err) => {
        setErroGps(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Libere o GPS para registrar."
            : "Não foi possível obter a posição. Tente em céu aberto."
        );
        setCapturando(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    // Limpa o campo: escolher a mesma foto de novo, depois de removê-la,
    // não dispararia mudança nenhuma.
    e.target.value = "";
    if (!arquivo) return;
    const blob = await reduzirFoto(arquivo);
    if (foto) URL.revokeObjectURL(foto.url);
    setFoto({ blob, url: URL.createObjectURL(blob) });
  };

  const itemEscolhido = protocolo?.itens.find((i) => i.id === itemId) ?? null;

  const pronto =
    expedicaoId !== null &&
    gps !== null &&
    protocolo !== null &&
    (itemEscolhido !== null || descricao.trim() !== "");

  const montarRegistro = (): RegistroDeCampo | null => {
    const expedicao = expedicoes?.find((x) => x.id === expedicaoId);
    if (!expedicao || !gps || !protocolo) return null;
    const valorNumerico = Number(valor.replace(",", "."));
    return {
      expedicaoId: expedicao.id,
      escolaId: expedicao.escola_id,
      versaoId: protocolo.versao_id,
      itemId,
      valor: valor !== "" && Number.isFinite(valorNumerico) ? valorNumerico : null,
      // A descrição é obrigatória no banco; sem texto, vale o item.
      descricao: descricao.trim() || itemEscolhido?.nome || "Registro de campo",
      origemProvavel: origem.trim() || null,
      lat: gps.lat,
      lng: gps.lng,
      legenda: legenda.trim() || null,
    };
  };

  const limparParaProximo = () => {
    setItemId(null);
    setValor("");
    setDescricao("");
    setOrigem("");
    setLegenda("");
    if (foto) URL.revokeObjectURL(foto.url);
    setFoto(null);
    setGps(null);
  };

  const salvar = async () => {
    const registro = montarRegistro();
    if (!registro) return;
    setEnviando(true);
    setMensagem(null);

    // Sem rede nem tenta: direto para a fila, sem esperar timeout.
    if (!navigator.onLine) {
      await enfileirar(registro, foto?.blob ?? null);
      setPendentes(await listarPendentes());
      setEnviando(false);
      limparParaProximo();
      setMensagem({ tipo: "fila", texto: "Sem rede. O registro ficou guardado no aparelho e sobe quando a conexão voltar." });
      return;
    }

    const { erro, soFotoFalhou } = await enviarRegistro(registro, foto?.blob ?? null);
    setEnviando(false);

    if (!erro) {
      limparParaProximo();
      // Diz onde o registro ficou e o que falta para ele aparecer. Sem
      // isto, quem procurava o ponto no mapa ou na linha do tempo logo
      // depois não o encontrava — e não tinha como saber que ele está
      // guardado num rascunho, à espera da revisão.
      const x = expedicoes?.find((e) => e.id === registro.expedicaoId);
      setMensagem({
        tipo: "ok",
        texto: `Registro guardado na expedição #${x?.numero ?? ""}${x ? ` da ${x.escola_nome}` : ""}. Ele vai ao mapa e à linha do tempo quando a expedição for revisada e publicada; a foto, quando for publicada na galeria. Marque o próximo ponto.`,
        link: { href: `/expedicoes/${registro.expedicaoId}`, rotulo: "Ver a saída" },
      });
      return;
    }

    if (soFotoFalhou) {
      // A ocorrência entrou; só a foto ficou. Guarda o erro sem
      // reenfileirar tudo, senão a ocorrência duplicaria.
      limparParaProximo();
      setMensagem({
        tipo: "erro",
        texto: `A ocorrência foi gravada, mas a foto não subiu: ${erro}. Reenvie a foto pela transcrição.`,
      });
      return;
    }

    if (pareceRede(erro)) {
      await enfileirar(registro, foto?.blob ?? null);
      setPendentes(await listarPendentes());
      limparParaProximo();
      setMensagem({ tipo: "fila", texto: "A rede falhou no envio. O registro ficou guardado no aparelho." });
      return;
    }

    setMensagem({ tipo: "erro", texto: erro });
  };


  if (expedicoes === null) {
    return (
      <main className="flex-1 max-w-xl mx-auto w-full p-4">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-xl mx-auto w-full p-4 pb-24 space-y-4">
      <Voltar para="painel" />
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Registrar em campo
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          GPS, foto e ocorrência direto do celular, na expedição aberta. As contagens de
          resíduos e microplásticos continuam na ficha, que mede esforço por área.
        </p>
      </div>

      {/* Fila pendente */}
      {pendentes.length > 0 && (
        <div className="p-3 rounded-sm border border-amber-500/40 bg-amber-500/10 text-xs space-y-2">
          <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
            <CloudUpload className="w-4 h-4" />
            {pendentes.length} registro(s) aguardando rede
          </p>
          <button
            onClick={() => reenviarPendentes()}
            disabled={reenviando}
            className="w-full py-2 text-xs font-semibold uppercase tracking-wider bg-amber-600 text-white rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {reenviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Reenviar agora
          </button>
        </div>
      )}

      {/* Sem rede, mas com a cópia da última vez: dá para registrar, e o
          que for registrado vai para a fila. */}
      {catalogoDe && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-amber-500/40 bg-amber-500/10 text-xs">
          <CloudUpload className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
          <p className="text-amber-800 dark:text-amber-300">
            Sem conexão. Usando as expedições e protocolos guardados em{" "}
            {new Date(catalogoDe).toLocaleDateString("pt-BR")}. Pode registrar normalmente
            — tudo fica na fila e sobe quando o sinal voltar.
          </p>
        </div>
      )}

      {/* Nem rede nem cópia local: não há como montar o formulário. */}
      {semCatalogo && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
          <p>
            Não foi possível carregar as expedições, e este aparelho ainda não tem
            uma cópia guardada. Abra esta página uma vez com internet — de
            preferência na escola, antes da saída — e ela passa a funcionar sem sinal.
          </p>
        </div>
      )}

      {/* 1. Expedição */}
      <section className="bg-card border border-border rounded-md p-4 space-y-2 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary">1 · Expedição</h2>
        {expedicoes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {semCatalogo ? (
              "Sem lista de expedições neste aparelho."
            ) : (
              <>
                Nenhuma saída aberta para registro.{" "}
                {encerradas.length === 0 ? (
                  <>
                    <Link href="/expedicoes/nova" className="text-primary hover:underline">
                      Abra uma saída de campo
                    </Link>{" "}
                    antes de registrar.
                  </>
                ) : (
                  "O registro em campo só aceita saída aberta (em rascunho). Estas foram enviadas para revisão — se ainda falta registrar, reabra:"
                )}
              </>
            )}
          </p>
        ) : null}

        {/* Saídas já enviadas, com o caminho de volta. Aparece quando
            não há saída aberta, ou quando a saída pedida no endereço já
            foi enviada. */}
        {encerradas.length > 0 && (
          <ul className="space-y-2">
            {encerradas.map((x) => (
              <li key={x.id} className="border border-border rounded-sm p-2.5 text-xs space-y-1.5">
                <p>
                  <strong>#{x.numero}</strong> · {x.data_campo.split("-").reverse().join("/")} ·{" "}
                  {x.titulo ?? "Sem título"} · {x.escola_nome}{" "}
                  <span className="text-muted-foreground">
                    ({NOME_DA_ETAPA[x.status as Etapa] ?? x.status})
                  </span>
                </p>
                {reabrindo?.id === x.id && !reabrindo.processando ? (
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">
                      A saída volta a rascunho e refaz as etapas da revisão
                      {x.status === "validado" && "; a validação é desfeita"}. Reabrir?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReabrindo(null)}
                        className="px-3 py-1.5 font-semibold border border-border rounded-sm hover:bg-secondary"
                      >
                        Não
                      </button>
                      <button
                        onClick={() => reabrir(x.id)}
                        className="px-3 py-1.5 font-semibold bg-accent text-accent-foreground rounded-sm hover:opacity-90"
                      >
                        Reabrir e registrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReabrindo({ id: x.id, processando: false })}
                    disabled={reabrindo?.processando}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold border border-border rounded-sm hover:bg-secondary disabled:opacity-50"
                  >
                    {reabrindo?.id === x.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Reabrir para registrar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {erroReabrir && <p className="text-xs text-destructive">{erroReabrir}</p>}

        {expedicoes.length > 0 && (
          <select
            value={expedicaoId ?? ""}
            onChange={(e) => setExpedicaoId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-sm"
          >
            <option value="">Escolha a expedição…</option>
            {expedicoes.map((x) => (
              <option key={x.id} value={x.id}>
                #{x.numero} · {x.data_campo.split("-").reverse().join("/")} · {x.titulo ?? "Sem título"} ·{" "}
                {x.escola_nome}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* 2. Localização */}
      <section className="bg-card border border-border rounded-md p-4 space-y-2 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary">2 · Localização</h2>
        <button
          onClick={capturarGps}
          disabled={capturando}
          className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {capturando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
          {gps ? "Capturar de novo" : "Capturar GPS"}
        </button>
        {gps && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}{" "}
            {gps.precisao === null ? (
              <span>(marcado no mapa)</span>
            ) : (
              <span className={gps.precisao > 30 ? "text-amber-600 dark:text-amber-400" : ""}>
                (±{gps.precisao} m
                {gps.precisao > 30 ? " — precisão baixa: tente de novo, ou ajuste o pino no mapa" : ""})
              </span>
            )}
          </p>
        )}
        {erroGps && <p className="text-xs text-destructive">{erroGps}</p>}

        {/* Ou à mão, no mapa. Serve quando o GPS erra — embaixo de árvore,
            perto de prédio, a precisão passa de 50 m — e quando o registro
            é feito depois, de volta à sala, sobre o ponto que a turma viu.
            O pino do mapa é o do protocolo escolhido, o mesmo que vai
            aparecer no mapa da rede. */}
        <div className="pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Ou marque no mapa
          </p>
          <SeletorDePosicao
            lat={gps?.lat ?? null}
            lng={gps?.lng ?? null}
            tipo="regular"
            pino={protocolo ? { slug: protocolo.icone, cor: protocolo.cor } : { slug: null, cor: null }}
            semBotaoDeLocalizacao
            dica={{
              comPosicao: "Arraste o pino até o ponto exato da ocorrência. No satélite dá para ver a areia, a restinga e a drenagem.",
              semPosicao: "Use o GPS acima ou toque no mapa onde está a ocorrência.",
            }}
            onMudar={(lat, lng) => setGps({ lat, lng, precisao: null })}
          />
        </div>
      </section>

      {/* 3. O que você encontrou */}
      <section className="bg-card border border-border rounded-md p-4 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
          3 · O que você encontrou
        </h2>

        <div className="grid grid-cols-1 gap-1.5">
          {protocolos.map((p) => (
            <button
              key={p.versao_id}
              onClick={() => {
                setProtocolo(p);
                setItemId(null);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-sm border text-left transition-colors ${
                protocolo?.versao_id === p.versao_id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary/50"
              }`}
            >
              <IconeBadge slug={p.icone} cor={p.cor} tamanho={28} />
              <span className="text-sm">{p.nome}</span>
            </button>
          ))}
        </div>

        {/* O método aprovado do protocolo. Fica aberto, não escondido
            atrás de um "saiba mais": metade dele é cuidado de segurança,
            e o momento de ler é este, antes de chegar perto. */}
        {protocolo?.metodo && (
          <div className="p-3 rounded-sm bg-secondary/60 border border-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Como registrar · {protocolo.codigo}
            </p>
            <p className="text-[11px] leading-relaxed">{protocolo.metodo}</p>
          </div>
        )}
        {/* Protocolo novo, com o método ainda em aprovação. Não se
            inventa método no lugar: diz-se que falta, e repete-se a regra
            que vale para toda ocorrência — observar sem se expor. */}
        {protocolo && !protocolo.metodo && (
          <div className="p-3 rounded-sm bg-amber-500/10 border border-amber-500/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
              Como registrar · {protocolo.codigo}
            </p>
            <p className="text-[11px] leading-relaxed">
              O método de campo deste protocolo ainda está em definição pelo Instituto Ecosurf.
              Enquanto isso, vale a regra de toda ocorrência: registre o que dá para ver de onde
              você está, sem tocar, sem recolher e sem se expor.
            </p>
          </div>
        )}

        {protocolo && protocolo.itens.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {protocolo.itens.map((i) => (
              <button
                key={i.id}
                onClick={() => setItemId(itemId === i.id ? null : i.id)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-sm border text-left transition-colors ${
                  itemId === i.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/50"
                }`}
              >
                <IconeBadge slug={i.icone} cor={protocolo.cor} tamanho={22} />
                <span className="text-xs leading-tight">{i.nome}</span>
              </button>
            ))}
          </div>
        )}

        {itemEscolhido && (
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Magnitude{itemEscolhido.unidade ? ` (${itemEscolhido.unidade})` : ""}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="3"
              className="w-full px-3 py-2 text-sm tabular-nums bg-background border border-input rounded-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Descrição do ponto
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder={itemEscolhido ? itemEscolhido.nome : "O que está acontecendo aqui?"}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Origem provável (opcional)
          </label>
          <input
            type="text"
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            placeholder="Descarte doméstico, drenagem urbana…"
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
          />
        </div>
      </section>

      {/* 4. Foto */}
      <section className="bg-card border border-border rounded-md p-4 space-y-2 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
          4 · Foto (opcional)
        </h2>
        <p className="text-[11px] text-muted-foreground">
          A foto entra sem publicação. Só chega à galeria com curadoria do professor e termo de
          uso de imagem da escola — e sem rosto identificável de estudante.
        </p>
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={escolherFoto}
          className="hidden"
        />
        <input ref={galeriaInputRef} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />
        {foto ? (
          <div className="space-y-2">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.url} alt="Prévia da foto" className="w-full h-44 object-cover rounded-sm" />
              <button
                onClick={() => {
                  URL.revokeObjectURL(foto.url);
                  setFoto(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white"
                aria-label="Remover foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              placeholder="Legenda da foto (opcional)"
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fotoInputRef.current?.click()}
              className="py-2.5 text-xs font-semibold uppercase tracking-wider border border-dashed border-border rounded-sm hover:bg-secondary transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Tirar foto
            </button>
            <button
              onClick={() => galeriaInputRef.current?.click()}
              className="py-2.5 text-xs font-semibold uppercase tracking-wider border border-dashed border-border rounded-sm hover:bg-secondary transition-colors flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Da galeria
            </button>
          </div>
        )}
      </section>

      {mensagem && (
        <div
          className={`p-3 rounded-sm text-xs flex items-start gap-2 border ${
            mensagem.tipo === "erro"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : mensagem.tipo === "fila"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {mensagem.tipo === "erro" ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : mensagem.tipo === "fila" ? (
            <CloudUpload className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>
            {mensagem.texto}
            {mensagem.link && (
              <>
                {" "}
                <Link href={mensagem.link.href} className="font-semibold underline underline-offset-2">
                  {mensagem.link.rotulo}
                </Link>
              </>
            )}
          </span>
        </div>
      )}

      <button
        onClick={salvar}
        disabled={!pronto || enviando}
        className="w-full py-3 text-sm font-semibold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {enviando ? "Enviando…" : "Salvar registro"}
      </button>

      {!pronto && (
        <p className="text-[11px] text-center text-muted-foreground">
          Para salvar: expedição, posição (GPS ou mapa) e um item escolhido — ou uma descrição.
        </p>
      )}
      <VoltarRodape para="painel" />
    </main>
  );
}

export default function CampoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <RotaProtegida>
        <CampoConteudo />
      </RotaProtegida>
    </div>
  );
}
