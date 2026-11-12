import { ETAPAS, indiceDaEtapa, type Etapa } from "@/lib/revisao";

export const NOME_DA_ETAPA: Record<Etapa, string> = {
  rascunho: "Rascunho",
  enviado: "Enviada",
  revisado: "Revisada",
  validado: "Validada",
  publicado: "Publicada",
};

/** A régua das cinco etapas, com a atual em destaque. */
export function ReguaDeEtapas({ status }: { status: string }) {
  const atual = indiceDaEtapa(status);
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1">
      {ETAPAS.map((etapa, i) => {
        const passou = i <= atual;
        return (
          <li key={etapa} className="flex items-center gap-1 shrink-0">
            <span
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-sm border ${
                i === atual
                  ? "bg-primary text-primary-foreground border-primary"
                  : passou
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {NOME_DA_ETAPA[etapa]}
            </span>
            {i < ETAPAS.length - 1 && <span className={`w-4 h-px ${passou ? "bg-primary/40" : "bg-border"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
