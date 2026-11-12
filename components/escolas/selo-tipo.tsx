import { IconeBadge, pinoDaOrganizacao } from "@/components/mapa/icones";
import { PROGRAMA, tipoDe, vocabulario } from "@/lib/organizacao";

/**
 * O selo que diz "isto é uma escola de surf".
 *
 * Só a escola de surf o recebe. A escola regular é o caso de sempre da
 * plataforma, e um selo em cada linha dela seria ruído — o que precisa
 * saltar aos olhos, na fila de análise e na página pública, é o que é
 * diferente.
 */
export function SeloTipo({
  tipo,
  comPrograma = false,
  className = "",
}: {
  tipo: string | null | undefined;
  /** Acrescenta "· Guardiões Ecosurf". Para a página pública. */
  comPrograma?: boolean;
  className?: string;
}) {
  const t = tipoDe(tipo);
  if (t !== "surf") return null;
  const pino = pinoDaOrganizacao(t);

  return (
    <span
      className={`inline-flex items-center gap-1 align-middle text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className}`}
    >
      <IconeBadge slug={pino.slug} cor={pino.cor} tamanho={16} />
      {vocabulario(t).organizacao}
      {comPrograma && ` · ${PROGRAMA[t]}`}
    </span>
  );
}
