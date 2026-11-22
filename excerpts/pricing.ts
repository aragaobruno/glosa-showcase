import { accumulatedBefore, INDEX_SOURCE } from "./indices";
import type { ContractTerms, RateItem, Readjustment } from "./types";
import { addMonths, fmtMonth, fmtPct, fmtUnit, monthsBetween, unitPrice } from "./util";

export interface ReadjustStep {
  anniversary: string;
  accumulatedPct: number;
  appliedPct: number;
  capped: boolean;
  windowFrom: string;
  windowTo: string;
  priceAfter: number;
}

export interface PriceComputation {
  price: number;
  steps: ReadjustStep[];
}

/** Quantos reajustes já deveriam ter ocorrido na competência informada. */
export function periodsElapsed(baseMonth: string, competence: string, periodMonths: number): number {
  const diff = monthsBetween(baseMonth, competence);
  if (diff < 0) return 0;
  return Math.floor(diff / periodMonths);
}

/**
 * Preço contratual após `periods` reajustes.
 * `ignoreCap` serve só para diagnóstico (detectar reajuste acima do teto).
 * Retorna null quando falta índice publicado — o motor nunca extrapola.
 */
export function priceAfterPeriods(
  base: number,
  baseMonth: string,
  r: Readjustment,
  periods: number,
  opts: { ignoreCap?: boolean } = {},
): PriceComputation | null {
  let price = unitPrice(base);
  const steps: ReadjustStep[] = [];
  if (r.index === "NONE" || periods <= 0) return { price, steps };

  for (let k = 1; k <= periods; k++) {
    const anniversary = addMonths(baseMonth, k * r.periodMonths);
    const acc = accumulatedBefore(r.index, anniversary, r.periodMonths);
    if (!acc) return null;
    let applied = acc.pct;
    let capped = false;
    if (!opts.ignoreCap && r.capPct !== null && applied > r.capPct) {
      applied = r.capPct;
      capped = true;
    }
    if (r.floorZero && applied < 0) applied = 0;
    price = unitPrice(price * (1 + applied / 100));
    steps.push({
      anniversary,
      accumulatedPct: acc.pct,
      appliedPct: applied,
      capped,
      windowFrom: acc.from,
      windowTo: acc.to,
      priceAfter: price,
    });
  }
  return { price, steps };
}

export function expectedPrice(
  contract: ContractTerms,
  item: RateItem,
  competence: string,
): PriceComputation | null {
  const r = contract.readjustment.value;
  const n = periodsElapsed(contract.baseMonth.value, competence, r.periodMonths);
  return priceAfterPeriods(item.unitPrice, contract.baseMonth.value, r, n);
}

/** Explicação passo a passo, no formato que um auditor confere com calculadora. */
export function describeSteps(
  contract: ContractTerms,
  item: RateItem,
  comp: PriceComputation,
): string[] {
  const r = contract.readjustment.value;
  const lines = [
    `Preço na data-base (${fmtMonth(contract.baseMonth.value)}): ${fmtUnit(item.unitPrice)} por ${item.unit}`,
  ];
  if (r.index === "NONE") {
    lines.push("Contrato sem cláusula de reajuste: o preço permanece fixo.");
    return lines;
  }
  if (comp.steps.length === 0) {
    lines.push(
      `Nenhum reajuste devido ainda (primeiro aniversário em ${fmtMonth(addMonths(contract.baseMonth.value, r.periodMonths))}).`,
    );
  }
  for (const s of comp.steps) {
    const capNote = s.capped ? ` → limitado ao teto de ${fmtPct(r.capPct ?? 0)}` : "";
    const floorNote = s.accumulatedPct < 0 && r.floorZero ? " → variação negativa não reduz o preço" : "";
    lines.push(
      `Reajuste de ${fmtMonth(s.anniversary)}: ${INDEX_SOURCE[r.index]} acumulado ${fmtMonth(s.windowFrom)}–${fmtMonth(s.windowTo)} = ${fmtPct(s.accumulatedPct, 4)}${capNote}${floorNote} ⇒ ${fmtUnit(s.priceAfter)}`,
    );
  }
  lines.push(`Preço unitário devido: ${fmtUnit(comp.price)}`);
  return lines;
}
