const FUSO = "America/Sao_Paulo";

/** "2026-09-29" → "29/09/2026" (sem conversão de fuso: é uma data pura). */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Timestamp ISO → "29/09/2026 16:20" no horário de Brasília. */
export function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSO,
  }).format(new Date(iso));
}

/** Data de hoje (YYYY-MM-DD) no horário de Brasília. */
export function hojeIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date());
}

export function percentual(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100);
}
