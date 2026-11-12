import Link from "next/link";
import { MapPin, Compass, Route, Package } from "lucide-react";

import { IconeBadge, pinoDaOrganizacao } from "@/components/mapa/icones";
import { FotoEvidencia } from "@/components/ui/foto-evidencia";
import type { PubEscola, PubIndicadorEscola } from "@/lib/database.types";

/**
 * O cartão de uma organização da rede — escola ou escola de surf.
 *
 * O disco à esquerda é o mesmo do pino no mapa, com a mesma cor e o
 * mesmo glifo: quem viu o pino magenta no mapa reconhece aqui de que
 * tipo é a escola sem precisar ler o rótulo.
 */
export function CartaoEscola({
  escola,
  indicador,
}: {
  escola: PubEscola;
  indicador: PubIndicadorEscola | undefined;
}) {
  const pino = pinoDaOrganizacao(escola.tipo);

  return (
    <Link
      href={`/escola/${escola.slug}`}
      className="block bg-card border border-border rounded-md overflow-hidden hover:border-primary transition-colors"
    >
      {/* A capa, quando há. Sem ela o cartão segue como era, sem um
          espaço cinza no lugar da foto: escola sem capa não é escola
          com defeito. */}
      {escola.capa_path && (
        <FotoEvidencia
          storagePath={escola.capa_path}
          alt={`Foto de ${escola.nome}`}
          className="w-full h-36 object-cover border-b border-border"
        />
      )}
      <div className="p-4">
      <div className="flex items-start gap-2.5">
        <IconeBadge slug={pino.slug} cor={pino.cor} tamanho={28} className="mt-0.5" />
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">{escola.nome}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {escola.municipio} · {escola.uf}
          </p>
        </div>
      </div>

      {escola.apresentacao && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{escola.apresentacao}</p>
      )}

      <dl className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Compass className="w-3 h-3" />
          <dd className="font-semibold text-foreground">{indicador?.expedicoes ?? 0}</dd>
          <dt>expedições</dt>
        </div>
        <div className="flex items-center gap-1">
          <Route className="w-3 h-3" />
          <dd className="font-semibold text-foreground">
            {((indicador?.extensao_total_m ?? 0) / 1000).toFixed(1).replace(".", ",")}
          </dd>
          <dt>km</dt>
        </div>
        <div className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          <dd className="font-semibold text-foreground">
            {(indicador?.itens_catalogados ?? 0).toLocaleString("pt-BR")}
          </dd>
          <dt>itens</dt>
        </div>
      </dl>
      </div>
    </Link>
  );
}
