"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { Waves, LogIn, UserPlus, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSessao } from "@/lib/sessao";

/** Traduz as mensagens do Supabase Auth, que chegam em inglês. */
function traduzErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme o e-mail antes de entrar. Verifique a sua caixa de entrada.";
  if (m.includes("user already registered")) return "Este e-mail já tem cadastro. Faça login.";
  if (m.includes("password should be at least")) return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas seguidas. Aguarde um minuto.";
  return msg;
}

export default function EntrarPage() {
  const router = useRouter();
  const { disponivel } = useSessao();
  const [modo, setModo] = useState<"login" | "registro" | "recuperar">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!disponivel) {
      setMensagem({
        tipo: "erro",
        texto: "Autenticação indisponível: este ambiente está sem as variáveis do Supabase.",
      });
      return;
    }

    setCarregando(true);

    try {
      if (modo === "recuperar") {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/entrar`,
        });
        // Resposta igual com e sem cadastro, para não revelar quem tem conta.
        setMensagem({
          tipo: "sucesso",
          texto: "Se o e-mail estiver cadastrado, enviamos um link de recuperação para a sua caixa de entrada.",
        });
        return;
      }

      if (modo === "registro") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        });
        if (error) {
          setMensagem({ tipo: "erro", texto: traduzErro(error.message) });
          return;
        }
        // Sem sessão imediata significa que o projeto exige confirmação por e-mail.
        if (!data.session) {
          setMensagem({
            tipo: "sucesso",
            texto: "Conta criada. Confirme o e-mail pelo link que enviamos e depois faça login.",
          });
          setModo("login");
          return;
        }
        router.push("/onboarding");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        setMensagem({ tipo: "erro", texto: traduzErro(error.message) });
        return;
      }
      router.push("/painel");
    } catch (err) {
      setMensagem({
        tipo: "erro",
        texto: err instanceof Error ? traduzErro(err.message) : "Falha inesperada ao autenticar.",
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <BarraNavegacao />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-md shadow-lg p-6 md:p-8">
          {/* Cabeçalho do Card */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary mb-3">
              <Waves className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {modo === "login" && "Acessar Plataforma"}
              {modo === "registro" && "Criar Conta de Educador"}
              {modo === "recuperar" && "Recuperar Senha"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Plataforma de Ciência Cidadã Costeira · Instituto Ecosurf
            </p>
          </div>

          {/* Alertas */}
          {mensagem && (
            <div
              className={`p-3 rounded-sm text-xs mb-5 flex items-start gap-2 border ${
                mensagem.tipo === "erro"
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {mensagem.tipo === "erro" ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{mensagem.texto}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === "registro" && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Profª Helena Santos"
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <p className="text-[11px] text-muted-foreground bg-muted/50 border border-border rounded-sm p-2.5 leading-relaxed">
                  A conta nasce como <strong className="text-foreground">professor</strong>.
                  Coordenação e pesquisa são concedidas pelo Instituto Ecosurf depois do
                  cadastro — o papel não é escolhido por quem se inscreve.
                  <br />
                  <span className="block mt-1.5">
                    Não existe conta de estudante. Quem transcreve a ficha é sempre o
                    professor responsável.
                  </span>
                </p>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                E-mail Institucional ou Pessoal
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@escola.sp.gov.br"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {modo !== "recuperar" && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Senha
                  </label>
                  {modo === "login" && (
                    <button
                      type="button"
                      onClick={() => setModo("recuperar")}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 rounded-sm transition-opacity flex items-center justify-center gap-2 mt-2"
            >
              {carregando ? (
                <span>Aguarde…</span>
              ) : modo === "login" ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              ) : modo === "registro" ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Minha Conta</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Enviar Link de Recuperação</span>
                </>
              )}
            </button>
          </form>

          {/* Alternar modos */}
          <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground space-y-2">
            {modo === "login" && (
              <p>
                Ainda não tem conta de educador?{" "}
                <button
                  onClick={() => setModo("registro")}
                  className="text-primary font-semibold hover:underline"
                >
                  Cadastre sua escola
                </button>
              </p>
            )}
            {modo === "registro" && (
              <p>
                Já tem um cadastro?{" "}
                <button
                  onClick={() => setModo("login")}
                  className="text-primary font-semibold hover:underline"
                >
                  Fazer login
                </button>
              </p>
            )}
            {modo === "recuperar" && (
              <p>
                Lembrou a senha?{" "}
                <button
                  onClick={() => setModo("login")}
                  className="text-primary font-semibold hover:underline"
                >
                  Voltar para o login
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
