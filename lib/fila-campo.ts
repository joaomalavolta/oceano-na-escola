/**
 * Fila local de registros de campo.
 *
 * Na praia o sinal falha, e o registro não pode falhar junto. O que não
 * sobe na hora fica aqui, em IndexedDB — localStorage não guarda Blob,
 * e a foto é a parte que importa — e sobe quando a rede voltar.
 *
 * A fila guarda o registro inteiro, foto inclusive. Nada é apagado
 * antes de o envio confirmar.
 */

export interface RegistroDeCampo {
  expedicaoId: number;
  escolaId: number;
  versaoId: number;
  itemId: number | null;
  valor: number | null;
  descricao: string;
  origemProvavel: string | null;
  lat: number;
  lng: number;
  legenda: string | null;
}

export interface RegistroPendente {
  id: string;
  criadoEm: string;
  registro: RegistroDeCampo;
  foto: Blob | null;
}

const BANCO = "oceano-campo";
const LOJA = "pendentes";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BANCO, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(LOJA)) {
        req.result.createObjectStore(LOJA, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function transacao<T>(
  modo: IDBTransactionMode,
  acao: (loja: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return abrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(LOJA, modo);
        const req = acao(tx.objectStore(LOJA));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

export async function enfileirar(registro: RegistroDeCampo, foto: Blob | null): Promise<string> {
  const pendente: RegistroPendente = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    criadoEm: new Date().toISOString(),
    registro,
    foto,
  };
  await transacao("readwrite", (loja) => loja.add(pendente));
  return pendente.id;
}

export async function listarPendentes(): Promise<RegistroPendente[]> {
  try {
    return await transacao("readonly", (loja) => loja.getAll() as IDBRequest<RegistroPendente[]>);
  } catch {
    return [];
  }
}

export async function removerPendente(id: string): Promise<void> {
  await transacao("readwrite", (loja) => loja.delete(id));
}
