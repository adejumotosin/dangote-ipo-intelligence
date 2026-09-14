import { IPO, Scenario } from "./data";

export interface ModelOutput {
  annualBarrels: number;
  contributionUsd: number;
  ebitdaUsd: number;
  ebitUsd: number;
  interestUsd: number;
  preTaxUsd: number;
  patUsd: number;
  patNgn: number;
  epsNgn: number;
  fairValueNgn: number;
  upside: number;
  netDebtUsd: number;
  netDebtToEbitda: number | null;
  impliedPE: number | null;
}

export interface ReverseOutput {
  requiredPatNgn: number;
  requiredPatUsd: number;
  requiredGrm: number | null;
  gap: number | null;
}

export function calculateScenario(s: Scenario): ModelOutput {
  const annualBarrels = s.capacityKbd * 1000 * (s.utilisation / 100) * 365;
  const contributionUsd = annualBarrels * s.grm;
  const fixedCost = s.fixedCostBn * 1e9;
  const dna = s.dnaBn * 1e9;
  const interestUsd = s.grossDebtBn * 1e9 * (s.interestRate / 100);
  const ebitdaUsd = contributionUsd - fixedCost;
  const ebitUsd = ebitdaUsd - dna;
  const preTaxUsd = ebitUsd - interestUsd;
  const patUsd = preTaxUsd > 0 ? preTaxUsd * (1 - s.taxRate / 100) : preTaxUsd;
  const patNgn = patUsd * s.usdNgn;
  const epsNgn = patNgn / IPO.postListingShares;
  const fairValueNgn = Math.max(0, epsNgn * s.targetPE);
  const netDebtUsd = (s.grossDebtBn - s.cashBn) * 1e9;
  return {
    annualBarrels, contributionUsd, ebitdaUsd, ebitUsd, interestUsd, preTaxUsd, patUsd, patNgn, epsNgn, fairValueNgn,
    upside: fairValueNgn / IPO.price - 1,
    netDebtUsd,
    netDebtToEbitda: ebitdaUsd > 0 ? netDebtUsd / ebitdaUsd : null,
    impliedPE: epsNgn > 0 ? IPO.price / epsNgn : null,
  };
}

export function reverseExpectations(s: Scenario): ReverseOutput {
  const annualBarrels = s.capacityKbd * 1000 * (s.utilisation / 100) * 365;
  const requiredPatNgn = (IPO.price * IPO.postListingShares) / s.targetPE;
  const requiredPatUsd = requiredPatNgn / s.usdNgn;
  const taxDenominator = 1 - s.taxRate / 100;
  if (annualBarrels <= 0 || taxDenominator <= 0) return { requiredPatNgn, requiredPatUsd, requiredGrm: null, gap: null };
  const requiredPreTaxUsd = requiredPatUsd / taxDenominator;
  const requiredContributionUsd = requiredPreTaxUsd + s.grossDebtBn * 1e9 * (s.interestRate / 100) + s.dnaBn * 1e9 + s.fixedCostBn * 1e9;
  const requiredGrm = requiredContributionUsd / annualBarrels;
  return { requiredPatNgn, requiredPatUsd, requiredGrm, gap: requiredGrm - s.grm };
}

export const format = {
  ngn: (v: number, digits = 0) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: digits }).format(v),
  usdBn: (v: number) => "$" + (v / 1e9).toFixed(2) + "bn",
  ngnTn: (v: number) => "₦" + (v / 1e12).toFixed(2) + "tn",
  number: (v: number, digits = 1) => new Intl.NumberFormat("en-NG", { maximumFractionDigits: digits }).format(v),
  percent: (v: number) => (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%",
};
