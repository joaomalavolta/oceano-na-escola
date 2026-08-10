"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarraNavegacao } from "@/components/navegacao/barra-navegacao";
import { Waves, LogIn, UserPlus, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

export default function EntrarPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "registro" | "recuperar">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("professor");
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (modo === "registro" && cargo === "estudante") {
      setMensagem({
        tipo: "erro",
        texto: "Contas para estudantes não são permitidas. Por favor, solicite ao professor responsável da sua escola para cadastrar as expedições.",
      });
      return;
    }

    setCarregando(true);

    setTimeout(() => {
      setCarregando(false);

      if (modo === "recuperar") {
        setMensagem({
          tipo: "sucesso",
          texto: "Se o e-mail estiver cadastrado, enviamos um link de recuperação para a sua caixa de entrada.",
        });
        return;
      }

      // Simula login / registro bem sucedido
      const usuario = {
        email,
        nome: nome || "Prof. Helena Santos",
        cargo,
      };
      localStorage.setItem("oceano_auth", JSON.stringify(usuario));

      if (modo === "registro") {
        router.push("/onboarding");
      } else {
        router.push("/painel");
      }
    }, 600);
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

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Perfil de Atuação
                  </label>
                  <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="professor">Professor / Educador</option>
                    <option value="coordenador">Coordenador Pedagógico</option>
                    <option value="pesquisador">Pesquisador / Ecosurf</option>
                    <option value="estudante">Estudante</option>
                  </select>
                </div>
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
