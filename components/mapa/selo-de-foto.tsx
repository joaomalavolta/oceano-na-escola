import { Camera } from "lucide-react";

/**
 * O selinho de câmera no ombro do pino: "esta ocorrência tem foto".
 *
 * Sem ele, a única forma de achar o que tem imagem era clicar pino por
 * pino. Com ele, quem navega vê de longe onde há o que olhar — o pneu, o
 * entulho, a mancha na água — e vai direto.
 */
export function SeloDeFoto({ tamanho = 16 }: { tamanho?: number }) {
  return (
    <span
      className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full bg-white text-foreground border border-border shadow-sm pointer-events-none"
      style={{ width: tamanho, height: tamanho }}
      aria-hidden="true"
    >
      <Camera style={{ width: tamanho * 0.62, height: tamanho * 0.62 }} />
    </span>
  );
}
