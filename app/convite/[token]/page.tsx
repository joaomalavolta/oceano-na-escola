"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
  Waves,
} from "lucide-react";

import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { EstadoContainer } from "@/components/ui/estado-container";
import { supabase } from "@/lib/supabase";
import { useSessao } from "@/lib/sessao";
import { PAPEIS } from "@/lib/administracao";
import {
  carregarConvite,
  resgatarConvite,
  guardarConvite,
  esquecerConvite,
  type ConviteAberto,
} from "@/lib/convites";

/** As mesmas do login: o Supabase Auth responde em inglês. */
function traduzErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme o e-mail pelo link que enviamos e volte a esta página.";
  if (m.includes("user already registered"))
    return "Este e-mail já tem conta. Entre com a senha que você já usa.";
  if (m.includes("password should be at least"))
    return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas seguidas. Aguarde um minuto.";
  return msg;
}

const RECUSA: Record<string, string> = {
  expirado:
    "Este convite venceu. Peça um novo ao Instituto Ecosurf — leva um minuto para eles gerarem outro.",
  revogado: "Este convite foi cancelado pelo Instituto Ecosurf.",
  resgatado:
    "Este convite já foi usado. Se a conta é sua, entre normalmente com o seu e-mail e senha.",
};

function ConviteConteudo({ token }: { token: string }) {
  const router = useRouter();
  const { session, carregando: carregandoSessao, disponivel } = useSessao();

  const [convite, setConvite] = useState<ConviteAberto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modo, setModo] = useState<"criar" | "entrar">("criar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmePorEmail, setConfirmePorEmail] = useState(false);

  // O token fica guardado antes de qualquer coisa: se a pessoa criar
  // conta e o projeto exigir confirmação por e-mail, ela volta pelo link
  // do Supabase e não por este — e é o ProvedorSessao que resgata.
  useEffect(() => {
    guardarConvite(token);
    let ativo = true;
    carregarConvite(token).then((c) => {
      if (!ativo) return;
      setConvite(c);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [token]);

  // Já entrou nesta mesma aba: resgata na hora e sai da página.
  useEffect(() => {
    if (!session || !convite || convite.situacao !== "aberto") return;
    let ativo = true;
    resgatarConvite(token).then(({ destino, erro: falha }) => {
      if (!ativo) return;
      if (falha) {
        setErro(falha);
        return;
      }
      esquecerConvite();
      router.replace(destino ?? "/painel");
    });
    return () => {
      ativo = false;
    };
  }, [session, convite, token, router]);

  if (carregando || carregandoSessao) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <EstadoContainer estado="carregando" />
      </main>
    );
  }

  const papelNome = convite
    ? PAPEIS.find((p) => p.id === convite.papel)?.nome ?? convite.papel
    : "";

  const criarOuEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!disponivel) {
      setErro("Autenticação indisponível: este ambiente está sem as variáveis do Supabase.");
      return;
    }

    setOcupado(true);
    try {
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        });
        if (error) {
          setErro(traduzErro(error.message));
          return;
        }
        // Sem sessão na volta, o projeto exige confirmação por e-mail. O
        // token já está guardado, então o resgate acontece sozinho no
        // primeiro carregamento com sessão.
        if (!data.session) {
          setConfirmePorEmail(true);
          return;
        }
        return; // o efeito acima resgata e redireciona
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setErro(traduzErro(error.message));
    } catch (err) {
      setErro(err instanceof Error ? traduzErro(err.message) : "Falha inesperada.");
    } finally {
      setOcupado(false);
    }
  };

  const rotulo = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1";
  const campo =
    "w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-md shadow-lg p-6 md:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary mb-3">
            <Waves className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Convite para a plataforma</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Oceano na Escola · Instituto Ecosurf
          </p>
        </div>

        {!convite ? (
          <div className="p-3 rounded-sm text-xs bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Não encontramos este convite. Confira se o link veio inteiro — links quebram ao
              passar por aplicativo de mensagem.
            </span>
          </div>
        ) : convite.situacao !== "aberto" ? (
          <div className="space-y-4">
            <div className="p-3 rounded-sm text-xs bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{RECUSA[convite.situacao]}</span>
            </div>
            <Link
              href="/entrar"
              className="block w-full py-2.5 text-center text-xs font-semibold uppercase tracking-wider border border-border rounded-sm hover:bg-secondary transition-colors"
            >
              Ir para a tela de entrada
            </Link>
          </div>
        ) : confirmePorEmail ? (
          <div className="space-y-4">
            <div className="p-3 rounded-sm text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Conta criada. Confirme o e-mail pelo link que enviamos e o convite é aceito
                sozinho — você não precisa voltar a esta página.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* O que este convite dá. Escrito antes do formulário: quem
                recebe um link precisa saber o que está aceitando antes
                de digitar uma senha. */}
            <div className="p-3 rounded-sm border border-primary/30 bg-primary/5 space-y-2 text-xs">
              <p className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <span>
                  Convite para <strong>{convite.emailMascarado}</strong>. Só funciona com esse
                  endereço.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <span>
                  Você entra como <strong>{papelNome}</strong>
                  {convite.escolaNome ? (
                    <>
                      , já respondendo por <strong>{convite.escolaNome}</strong>
                    </>
                  ) : (
                    <> — a escola você cadastra no primeiro acesso</>
                  )}
                  .
                </span>
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Vale até {new Date(convite.expiraEm).toLocaleDateString("pt-BR")}.
                </span>
              </p>
              {convite.mensagem && (
                <p className="border-l-2 border-primary/40 pl-2.5 italic text-muted-foreground">
                  {convite.mensagem}
                </p>
              )}
            </div>

            {erro && (
              <div className="p-3 rounded-sm text-xs bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={criarOuEntrar} className="space-y-4">
              {modo === "criar" && (
                <div>
                  <label className={rotulo}>Nome completo</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Profª Helena Santos"
                    className={campo}
                  />
                </div>
              )}

              <div>
                <label className={rotulo}>E-mail que recebeu o convite</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={convite.emailMascarado}
                  className={campo}
                />
                {/* O endereço não vem preenchido de propósito: ele está
                    mascarado justamente para um link vazado não entregar
                    o e-mail de alguém, e preencher desfaria isso. */}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Precisa ser exatamente o endereço para onde o convite foi feito.
                </p>
              </div>

              <div>
                <label className={rotulo}>{modo === "criar" ? "Crie uma senha" : "Senha"}</label>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className={campo}
                />
              </div>

              <button
                type="submit"
                disabled={ocupado}
                className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {ocupado ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {modo === "criar" ? "Criar conta e aceitar" : "Entrar e aceitar"}
              </button>
            </form>

            <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
              {modo === "criar" ? (
                <p>
                  Já tem conta nesta plataforma?{" "}
                  <button
                    onClick={() => {
                      setModo("entrar");
                      setErro(null);
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Entrar com ela
                  </button>
                </p>
              ) : (
                <p>
                  Ainda não tem conta?{" "}
                  <button
                    onClick={() => {
                      setModo("criar");
                      setErro(null);
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Criar agora
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />
      <ConviteConteudo token={token} />
    </div>
  );
}
