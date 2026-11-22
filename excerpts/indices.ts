/**
 * Índices de preço — snapshot oficial do Banco Central (SGS).
 * IPCA: série 433 · IGP-M: série 189 · variação mensal em %.
 * Coletado em 2026-11-22 de https://api.bcb.gov.br/dados/serie/bcdata.sgs.{433,189}/dados
 *
 * O snapshot é versionado no código de propósito: uma auditoria precisa ser
 * reproduzível — o mesmo contrato + as mesmas faturas devem dar sempre o mesmo resultado.
 */
import type { IndexName } from "./types";
import { addMonths } from "./util";

const IPCA_RAW = [0.53,0.84,0.71,0.61,0.23,-0.08,0.12,0.23,0.26,0.24,0.28,0.56,0.42,0.83,0.16,0.38,0.46,0.21,0.38,-0.02,0.44,0.56,0.39,0.52,0.16,1.31,0.56,0.43,0.26,0.24,0.26,-0.11,0.48,0.09,0.18,0.33,0.33,0.70,0.88,0.67,0.58,0.16,0.07,-0.32,0.82,0.14];
const IGPM_RAW = [0.21,-0.06,0.05,-0.95,-1.84,-1.93,-0.72,-0.14,0.37,0.50,0.59,0.74,0.07,-0.52,-0.47,0.31,0.89,0.81,0.61,0.29,0.62,1.52,1.30,0.94,0.27,1.06,-0.34,0.24,-0.49,-1.67,-0.77,0.36,0.42,-0.36,0.27,-0.01,0.41,-0.73,0.52,2.73,0.84,-0.50,-1.16,-0.22,1.57,1.47];

const FIRST_MONTH = "2023-01";

function toSeries(raw: number[]): Record<string, number> {
  const out: Record<string, number> = {};
  raw.forEach((v, i) => (out[addMonths(FIRST_MONTH, i)] = v));
  return out;
}

export const INDEX_SERIES: Record<Exclude<IndexName, "NONE">, Record<string, number>> = {
  IPCA: toSeries(IPCA_RAW),
  IGPM: toSeries(IGPM_RAW),
};

export const INDEX_SOURCE: Record<Exclude<IndexName, "NONE">, string> = {
  IPCA: "IPCA/IBGE — BCB SGS série 433",
  IGPM: "IGP-M/FGV — BCB SGS série 189",
};

export const LAST_AVAILABLE_MONTH = addMonths(FIRST_MONTH, IPCA_RAW.length - 1);

/**
 * Variação acumulada (%) nos 12 meses ANTERIORES ao mês do aniversário.
 * Ex.: aniversário em 2025-03 → acumula 2024-03 … 2025-02.
 * Retorna null se faltar qualquer mês (o motor então emite um aviso, nunca chuta).
 */
export function accumulatedBefore(
  index: Exclude<IndexName, "NONE">,
  anniversaryMonth: string,
  months = 12,
): { pct: number; from: string; to: string } | null {
  const series = INDEX_SERIES[index];
  let factor = 1;
  const from = addMonths(anniversaryMonth, -months);
  const to = addMonths(anniversaryMonth, -1);
  for (let i = 0; i < months; i++) {
    const m = addMonths(from, i);
    const v = series[m];
    if (v === undefined) return null;
    factor *= 1 + v / 100;
  }
  return { pct: (factor - 1) * 100, from, to };
}
