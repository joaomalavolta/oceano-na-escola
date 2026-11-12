import { describe, it, expect } from "vitest";
import { situacaoDasFotos } from "./pino-com-foto";

const ok = { termos_ok: true, publicada: true };

describe("o que falta para o pino ter foto", () => {
  it("separa sem foto, aguardando curadoria e publicada", () => {
    const s = situacaoDasFotos(ok, [
      { fotos: 0, fotosPublicadas: 0 },
      { fotos: 2, fotosPublicadas: 0 },
      { fotos: 3, fotosPublicadas: 1 },
    ]);
    expect(s).toMatchObject({ ocorrencias: 3, semFoto: 1, aguardandoCuradoria: 1, comFotoPublicada: 1, fotosAguardando: 4 });
    expect(s.bloqueios).toEqual([]);
  });

  it("sem termo de imagem, avisa que nenhuma foto aparece", () => {
    const s = situacaoDasFotos({ termos_ok: false, publicada: true }, [{ fotos: 1, fotosPublicadas: 1 }]);
    expect(s.bloqueios).toHaveLength(1);
    expect(s.bloqueios[0]).toContain("termo");
  });

  it("escola fora do mapa também bloqueia", () => {
    expect(situacaoDasFotos({ termos_ok: true, publicada: false }, []).bloqueios).toHaveLength(1);
  });
});
