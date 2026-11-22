/**
 * GLOSA — modelo de domínio.
 *
 * Princípio: todo termo contratual carrega a evidência de onde veio.
 * - OBSERVED  : citação literal verificada no documento-fonte (página + trecho).
 * - INFERRED  : proposto pelo LLM, mas a citação NÃO foi encontrada no documento.
 *               Bloqueia a auditoria até um humano confirmar (fail-closed).
 * - CONFIRMED : revisado e confirmado por um humano.
 */

export type EvidenceStatus = "OBSERVED" | "INFERRED" | "CONFIRMED";

export interface Evidence {
  source: "contract" | "invoice" | "sla_report" | "index";
  /** Referência legível: "Cláusula 4.1, p. 2", "NF 000123, linha 2", "IPCA (BCB SGS 433)". */
  ref: string;
  /** Trecho literal do documento, quando houver. */
  quote?: string;
  page?: number;
  status: EvidenceStatus;
  /** Motivo quando a verificação falha (ex.: "citação não encontrada no documento"). */
  note?: string;
}

export interface Sourced<T> {
  value: T;
  evidence: Evidence;
}

export type IndexName = "IPCA" | "IGPM" | "NONE";

export interface Readjustment {
  index: IndexName;
  /** Periodicidade do reajuste em meses (normalmente 12). */
  periodMonths: number;
  /** Teto do reajuste por período, em % (ex.: 8 = 8%). null = sem teto. */
  capPct: number | null;
  /** Se true, variação negativa do índice não reduz o preço. */
  floorZero: boolean;
}

export interface RateItem {
  sku: string;
  description: string;
  unit: string;
  /** Preço unitário na data-base, em R$. */
  unitPrice: number;
}

export interface SlaTerms {
  /** Meta de disponibilidade mensal, em % (ex.: 99.5). */
  targetPct: number;
  /** SKUs cobertos pelo SLA (o crédito incide sobre o valor contratado deles). */
  skus: string[];
  /** Faixas: disponibilidade abaixo de belowPct gera creditPct de crédito. */
  tiers: { belowPct: number; creditPct: number }[];
}

export interface Cancellation {
  sku: string;
  /** Competência (YYYY-MM) a partir da qual o item não pode mais ser cobrado. */
  effectiveMonth: string;
}

export interface ContractTerms {
  id: string;
  title: string;
  supplier: { name: string; cnpj: string };
  customer: { name: string; cnpj: string };
  /** Mês da data-base dos preços (YYYY-MM). */
  baseMonth: Sourced<string>;
  readjustment: Sourced<Readjustment>;
  rateCard: Sourced<RateItem>[];
  sla: Sourced<SlaTerms> | null;
  paymentTermDays: Sourced<number> | null;
  cancellations: Sourced<Cancellation>[];
}

export const SLA_CREDIT_SKU = "CREDITO-SLA";

export interface InvoiceLine {
  lineNo: number;
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
  /** Para linhas de crédito: competência a que o crédito se refere. */
  refCompetence?: string;
}

export interface Invoice {
  id: string;
  number: string;
  contractId: string;
  supplierCnpj: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  competence: string; // YYYY-MM
  lines: InvoiceLine[];
  total: number;
}

export interface SlaMeasurement {
  contractId: string;
  competence: string;
  availabilityPct: number;
  ref: string;
}

export type RuleCode =
  | "PRECO_ACIMA_CONTRATO"
  | "REAJUSTE_ANTECIPADO"
  | "REAJUSTE_ACIMA_TETO"
  | "ITEM_NAO_CONTRATADO"
  | "COBRANCA_POS_CANCELAMENTO"
  | "FATURA_DUPLICADA"
  | "CREDITO_SLA_NAO_APLICADO"
  | "ERRO_ARITMETICO"
  | "PRAZO_PAGAMENTO_INFERIOR";

export type Severity = "alta" | "media" | "baixa";

export interface Finding {
  id: string;
  rule: RuleCode;
  severity: Severity;
  contractId: string;
  invoiceId: string;
  invoiceNumber: string;
  competence: string;
  sku?: string;
  lineNo?: number;
  title: string;
  explanation: string;
  /** Passo a passo da conta, legível por um auditor. */
  math: string[];
  /** Valor recuperável em R$ (0 para achados não monetários). */
  recoverable: number;
  evidence: Evidence[];
}

export interface AuditWarning {
  contractId: string;
  invoiceId?: string;
  message: string;
}

export interface AuditInput {
  contracts: ContractTerms[];
  invoices: Invoice[];
  sla: SlaMeasurement[];
}

export interface AuditResult {
  findings: Finding[];
  warnings: AuditWarning[];
  summary: {
    invoices: number;
    invoicedTotal: number;
    findings: number;
    recoverableTotal: number;
    byRule: Partial<Record<RuleCode, { count: number; recoverable: number }>>;
  };
  /** Versão do motor — permite reproduzir qualquer auditoria. */
  engineVersion: string;
}

export const RULE_LABELS: Record<RuleCode, string> = {
  PRECO_ACIMA_CONTRATO: "Preço acima do contrato",
  REAJUSTE_ANTECIPADO: "Reajuste aplicado antes do aniversário",
  REAJUSTE_ACIMA_TETO: "Reajuste acima do teto contratual",
  ITEM_NAO_CONTRATADO: "Item não previsto no contrato",
  COBRANCA_POS_CANCELAMENTO: "Cobrança após cancelamento",
  FATURA_DUPLICADA: "Fatura duplicada",
  CREDITO_SLA_NAO_APLICADO: "Crédito de SLA não aplicado",
  ERRO_ARITMETICO: "Erro aritmético na fatura",
  PRAZO_PAGAMENTO_INFERIOR: "Prazo de pagamento menor que o contratado",
};
