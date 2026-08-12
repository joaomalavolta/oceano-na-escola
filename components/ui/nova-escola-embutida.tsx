"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Plus, X } from "lucide-react";
import {
  cadastrarEscola,
  listarMunicipios,
  type Municipio,
} from "@/lib/cadastro-escola";

interface Props {
  onCriada: (escolaId: number) => void;
}

/**
 * Cadastro de escola dentro de outra tarefa.
 *
 * A ficha de saída de campo prendia o professor às escolas que já
 * existiam. Quando a escola dele não estava lá, o caminho era sair do
 * formulário, cadastrar em outra tela e voltar a preencher tudo de
 * novo — na prática, desistir.
 *
 * Aqui pede-se o mínimo para a escola existir: nome e município. O
 * resto — endereço, coordenada no mapa, apresentação, termo de imagem —
 * é preenchido depois, e a escola só aparece no mapa público quando
 * tiver coordenada e for publicada.
 *
 * O vínculo entre quem cadastra e a escola é criado por gatilho no
 * banco, não aqui: fazê-lo pelo cliente exigiria conceder escrita em
 * `vinculo_escola` a qualquer autenticado.
 */
export function NovaEscolaEmbutida({ onCriada }: Props) {
  const [aberto, setAberto] = useState(false);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [nome, setNome] = useState("");
  const [municipioId, setMunicipioId] = useState<number | "">("");
  const [rede, setRede] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto || municipios.length > 0) return;
    let ativo = true;
    listarMunicipios().then((m) => ativo && setMunicipios(m));
    return () => {
      ativo = false;
    };
  }, [aberto, municipios.length]);

  const salvar = async () => {
    if (nome.trim() === "" || municipioId === "") return;
    setSalvando(true);
    setErro(null);
    const { id, erro: falha } = await cadastrarEscola({
      nome: nome.trim(),
      municipio_id: Number(municipioId),
      rede_ensino: rede.trim(),
      endereco: "",
      apresentacao: "",
      lat: null,
      lng: null,
      termosOk: false,
      turmas: [],
    });
    setSalvando(false);

    if (falha || !id) {
      setErro(falha ?? "Não foi possível cadastrar a escola.");
      return;
    }
    setAberto(false);
    setNome("");
    setMunicipioId("");
    setRede("");
    onCriada(id);
  };

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        Cadastrar outra escola
      </button>
    );
  }

  return (
    <div className="border border-primary/40 bg-primary/5 rounded-sm p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Nova escola
        </span>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da escola"
        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={municipioId}
          onChange={(e) => setMunicipioId(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
        >
          <option value="">Município…</option>
          {municipios.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} — {m.uf}
            </option>
          ))}
        </select>

        <select
          value={rede}
          onChange={(e) => setRede(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-sm"
        >
          <option value="">Rede de ensino…</option>
          <option value="Municipal">Municipal</option>
          <option value="Estadual">Estadual</option>
          <option value="Federal">Federal</option>
          <option value="Particular">Particular</option>
        </select>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Endereço, posição no mapa, apresentação e termo de uso de imagem entram depois. A escola
        só aparece no mapa público quando tiver coordenada e for publicada.
      </p>

      {erro && (
        <p className="text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando || nome.trim() === "" || municipioId === ""}
        className="w-full py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
        Cadastrar e usar nesta saída
      </button>
    </div>
  );
}
