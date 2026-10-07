const BASE_MS = 10_000;
const MAXIMO_MS = 5 * 60_000;

/**
 * Backoff exponencial para retentativas: 10s, 20s, 40s, 80s... limitado a 5 min.
 * `tentativas` é o número de tentativas já realizadas (>= 1).
 */
export function calcularBackoffMs(tentativas: number): number {
  const expoente = Math.max(0, tentativas - 1);
  return Math.min(BASE_MS * 2 ** expoente, MAXIMO_MS);
}
