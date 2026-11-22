/** Utilidades determinísticas: datas por competência e arredondamento monetário. */

export function parseMonth(m: string): { y: number; mo: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(m);
  if (!match) throw new Error(`Competência inválida: "${m}" (esperado YYYY-MM)`);
  const y = Number(match[1]);
  const mo = Number(match[2]);
  if (mo < 1 || mo > 12) throw new Error(`Mês inválido em "${m}"`);
  return { y, mo };
}

export function monthIndex(m: string): number {
  const { y, mo } = parseMonth(m);
  return y * 12 + (mo - 1);
}

export function fromMonthIndex(i: number): string {
  const y = Math.floor(i / 12);
  const mo = (i % 12) + 1;
  return `${y}-${String(mo).padStart(2, "0")}`;
}

export function addMonths(m: string, n: number): string {
  return fromMonthIndex(monthIndex(m) + n);
}

export function monthsBetween(from: string, to: string): number {
  return monthIndex(to) - monthIndex(from);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) throw new Error(`Data inválida: ${fromIso} / ${toIso}`);
  return Math.round((b - a) / 86_400_000);
}

/** Arredonda half-up com correção de ponto flutuante. */
export function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON * Math.sign(n)) * f) / f;
}

export const money = (n: number) => round(n, 2);
export const unitPrice = (n: number) => round(n, 4);

/** Tolerância absoluta para comparar valores monetários (R$ 0,01). */
export const CENT = 0.01;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl4 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export const fmtBRL = (n: number) => brl.format(n);
export const fmtUnit = (n: number) => brl4.format(n);
export const fmtPct = (n: number, d = 2) =>
  `${n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })}%`;

export function fmtMonth(m: string): string {
  const { y, mo } = parseMonth(m);
  const names = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${names[mo - 1]}/${y}`;
}
