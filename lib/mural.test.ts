import { describe, it, expect } from "vitest";
import { LIMITES, caminhoDaMidia, problemaDaMidia, tipoDaMidia, extensaoDoVideo } from "./mural";

const MB = 1024 * 1024;

describe("tipo da mídia", () => {
  it("foto de qualquer formato de imagem", () => {
    for (const t of ["image/jpeg", "image/png", "image/heic", "image/webp"]) {
      expect(tipoDaMidia({ type: t }), t).toBe("foto_mural");
    }
  });

  it("vídeo nos três formatos que celular grava", () => {
    for (const t of ["video/mp4", "video/webm", "video/quicktime"]) {
      expect(tipoDaMidia({ type: t }), t).toBe("video_mural");
    }
  });

  it("o resto não entra", () => {
    for (const t of ["application/pdf", "video/x-msvideo", "audio/mpeg", ""]) {
      expect(tipoDaMidia({ type: t }), t).toBeNull();
    }
  });

  it("a extensão acompanha o tipo do vídeo", () => {
    expect(extensaoDoVideo("video/quicktime")).toBe("mov");
    expect(extensaoDoVideo("video/webm")).toBe("webm");
  });
});

describe("limites do vídeo", () => {
  const video = (size: number) => ({ type: "video/mp4", size, name: "v.mp4" });

  it("curto e leve passa", () => {
    expect(problemaDaMidia(video(20 * MB), 30)).toBeNull();
  });

  it("acima do tamanho não passa", () => {
    expect(problemaDaMidia(video(LIMITES.videoBytes + 1), 10)).toMatch(/50 MB/);
  });

  it("acima da duração não passa, e diz quanto tem", () => {
    expect(problemaDaMidia(video(10 * MB), 95)).toMatch(/95 s/);
  });

  it("duração desconhecida vale só o tamanho", () => {
    // Alguns .mov não revelam a duração ao navegador. Recusar todos eles
    // barraria o vídeo do iPhone; o tamanho continua conferido.
    expect(problemaDaMidia(video(10 * MB), null)).toBeNull();
  });

  it("foto grande passa: ela é reduzida antes do envio", () => {
    expect(problemaDaMidia({ type: "image/jpeg", size: 12 * MB, name: "f.jpg" }, null)).toBeNull();
  });
});

describe("caminho no Storage", () => {
  it("começa pela pasta da escola, que é o que a política confere", () => {
    expect(caminhoDaMidia(4, 17, 1786000000000, "ab12", "mp4")).toBe(
      "escola-4/mural-17/1786000000000-ab12.mp4"
    );
  });
});
