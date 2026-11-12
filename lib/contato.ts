/**
 * Contato público da escola: normalização e validação.
 *
 * As mesmas regras estão no banco, como constraint. Repetidas aqui para
 * a pessoa ver o problema ao digitar, e não como erro cru do Postgres
 * ao salvar. Quem manda é o banco — se as duas divergirem, ele recusa.
 */

export interface ContatoDaEscola {
  responsavel_nome: string | null;
  responsavel_funcao: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  contato_telefone_whatsapp: boolean;
  contato_site: string | null;
  contato_instagram: string | null;
  contato_facebook: string | null;
  contato_youtube: string | null;
  participantes_atendidos: number | null;
}

export const CONTATO_VAZIO: ContatoDaEscola = {
  responsavel_nome: null,
  responsavel_funcao: null,
  contato_email: null,
  contato_telefone: null,
  contato_telefone_whatsapp: false,
  contato_site: null,
  contato_instagram: null,
  contato_facebook: null,
  contato_youtube: null,
  participantes_atendidos: null,
};

function vazioViraNulo(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

/**
 * "@escola.surf", "instagram.com/escola.surf/" ou o link inteiro viram
 * "escola.surf". O banco guarda só o nome de usuário, e o link é montado
 * na tela — assim ninguém grava um "instagram" que aponta para outro lugar.
 */
export function normalizarInstagram(v: string | null | undefined): string | null {
  let t = vazioViraNulo(v);
  if (!t) return null;
  t = t.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^instagram\.com\//i, "");
  t = t.replace(/^@/, "").replace(/[/?#].*$/, "");
  return t === "" ? null : t;
}

/** Sem esquema, ganha https. Com esquema que não seja http(s), fica como está — e falha na validação. */
export function normalizarUrl(v: string | null | undefined): string | null {
  const t = vazioViraNulo(v);
  if (!t) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  return `https://${t}`;
}

export function urlValida(v: string | null): boolean {
  return v === null || /^https?:\/\/[^\s<>"]+$/i.test(v);
}

export function emailValido(v: string | null): boolean {
  return v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

export function telefoneValido(v: string | null): boolean {
  return v === null || /^\+?[0-9 ()-]{8,20}$/.test(v);
}

export function instagramValido(v: string | null): boolean {
  return v === null || /^[A-Za-z0-9._]{1,30}$/.test(v);
}

/**
 * Link do WhatsApp a partir do telefone digitado.
 *
 * Número brasileiro sem código do país — DDD mais 8 ou 9 dígitos —
 * ganha o 55. Com o código já escrito, fica como está. Sem dígitos
 * suficientes, não há link: um wa.me quebrado é pior que nenhum.
 */
export function linkDoWhatsapp(telefone: string | null): string | null {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return `https://wa.me/55${digitos}`;
  if (digitos.length >= 12 && digitos.length <= 15) return `https://wa.me/${digitos}`;
  return null;
}

export function linkDoInstagram(usuario: string | null): string | null {
  return usuario ? `https://instagram.com/${usuario}` : null;
}

/** Normaliza o que veio do formulário para o formato que o banco aceita. */
export function normalizarContato(c: ContatoDaEscola): ContatoDaEscola {
  return {
    responsavel_nome: vazioViraNulo(c.responsavel_nome),
    responsavel_funcao: vazioViraNulo(c.responsavel_funcao),
    contato_email: vazioViraNulo(c.contato_email)?.toLowerCase() ?? null,
    contato_telefone: vazioViraNulo(c.contato_telefone),
    // Sem telefone, a marca de WhatsApp não significa nada.
    contato_telefone_whatsapp: Boolean(vazioViraNulo(c.contato_telefone)) && c.contato_telefone_whatsapp,
    contato_site: normalizarUrl(c.contato_site),
    contato_instagram: normalizarInstagram(c.contato_instagram),
    contato_facebook: normalizarUrl(c.contato_facebook),
    contato_youtube: normalizarUrl(c.contato_youtube),
    participantes_atendidos: c.participantes_atendidos,
  };
}

/** Os problemas, campo a campo, já em português para a tela. */
export function problemasDoContato(c: ContatoDaEscola): Partial<Record<keyof ContatoDaEscola, string>> {
  const p: Partial<Record<keyof ContatoDaEscola, string>> = {};
  if (!emailValido(c.contato_email)) p.contato_email = "E-mail incompleto.";
  if (!telefoneValido(c.contato_telefone)) p.contato_telefone = "Use só números, espaço, parênteses e traço.";
  if (!urlValida(c.contato_site)) p.contato_site = "Endereço precisa começar com http:// ou https://.";
  if (!urlValida(c.contato_facebook)) p.contato_facebook = "Endereço precisa começar com http:// ou https://.";
  if (!urlValida(c.contato_youtube)) p.contato_youtube = "Endereço precisa começar com http:// ou https://.";
  if (!instagramValido(c.contato_instagram)) p.contato_instagram = "Só o nome de usuário: letras, números, ponto e sublinhado.";
  if (c.responsavel_nome && c.responsavel_nome.length > 120) p.responsavel_nome = "Até 120 caracteres.";
  if (c.responsavel_funcao && c.responsavel_funcao.length > 80) p.responsavel_funcao = "Até 80 caracteres.";
  if (c.participantes_atendidos !== null && (c.participantes_atendidos < 0 || c.participantes_atendidos > 100000 || !Number.isInteger(c.participantes_atendidos)))
    p.participantes_atendidos = "Um número inteiro entre 0 e 100.000.";
  return p;
}

export function temAlgumContato(c: ContatoDaEscola): boolean {
  return Boolean(
    c.responsavel_nome || c.contato_email || c.contato_telefone || c.contato_site ||
      c.contato_instagram || c.contato_facebook || c.contato_youtube
  );
}
