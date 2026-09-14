export const IPO = {
  price: 525,
  marketCapNgn: 65.22e12,
  postListingShares: 124.228571e9,
  baseOfferShares: 4.1e9,
  grossProceedsNgn: 2.1525e12,
  netProceedsUsd: 1.55e9,
  expansionCostUsd: 14.3e9,
} as const;

export interface Scenario {
  capacityKbd: number;
  utilisation: number;
  grm: number;
  usdNgn: number;
  fixedCostBn: number;
  dnaBn: number;
  grossDebtBn: number;
  cashBn: number;
  interestRate: number;
  taxRate: number;
  targetPE: number;
}

export const SCENARIOS: Record<string, Scenario> = {
  Prospectus: { capacityKbd: 700, utilisation: 95, grm: 24.2, usdNgn: 1364, fixedCostBn: 0.9, dnaBn: 0.75, grossDebtBn: 5.67, cashBn: 4.27, interestRate: 10.9, taxRate: 13.7, targetPE: 13 },
  Base: { capacityKbd: 700, utilisation: 90, grm: 18, usdNgn: 1500, fixedCostBn: 1, dnaBn: 0.8, grossDebtBn: 8, cashBn: 3, interestRate: 9, taxRate: 20, targetPE: 12 },
  Bull: { capacityKbd: 700, utilisation: 96, grm: 27, usdNgn: 1350, fixedCostBn: 0.9, dnaBn: 0.75, grossDebtBn: 6, cashBn: 4, interestRate: 8, taxRate: 15, targetPE: 15 },
  Bear: { capacityKbd: 700, utilisation: 75, grm: 11, usdNgn: 1700, fixedCostBn: 1.15, dnaBn: 0.85, grossDebtBn: 11, cashBn: 2, interestRate: 11, taxRate: 25, targetPE: 9 },
};

export const HISTORICALS = [
  { period: "2024", revenue: 9.38, gross: -0.89, operating: -0.94, pat: -2.23, grossMargin: -9.5, operatingMargin: -10, netMargin: -23.8 },
  { period: "2025", revenue: 18.74, gross: 0.35, operating: 0.22, pat: -0.72, grossMargin: 1.9, operatingMargin: 1.2, netMargin: -3.9 },
  { period: "H1 2026", revenue: 19.13, gross: 3.43, operating: 3.25, pat: 2.5, grossMargin: 17.9, operatingMargin: 17, netMargin: 13.1 },
];

export const PRODUCT_MIX = [
  { name: "PMS", value: 39.9 },
  { name: "AGO", value: 21.4 },
  { name: "ATF / Jet", value: 20.6 },
  { name: "RCO + CBFS", value: 16.6 },
  { name: "LPG", value: 1.3 },
  { name: "Polypropylene", value: 0.2 },
];

export const RISKS = [
  { name: "Refining-margin cyclicality", severity: "Very high" },
  { name: "Expansion execution", severity: "Very high" },
  { name: "Funding and future leverage", severity: "Very high" },
  { name: "Crude availability", severity: "High" },
  { name: "Operational interruption", severity: "High" },
  { name: "Governance and related parties", severity: "Medium-high" },
  { name: "Regulatory and tax", severity: "Medium-high" },
  { name: "FX and financing", severity: "Medium-high" },
  { name: "Competition", severity: "Medium" },
  { name: "Energy transition", severity: "Medium" },
  { name: "Trading liquidity", severity: "Medium" },
];

export const SOURCE_NOTES = [
  { id: "offer", title: "Offer summary and use of proceeds", text: "IPO price, base offer size, gross proceeds, retail minimum, ownership and stated application of proceeds." },
  { id: "business", title: "Business description and expansion programme", text: "Current capacity, product configuration, crude flexibility, operating milestones and the 1.4 million bpd expansion ambition." },
  { id: "financials", title: "Audited historical financial information", text: "2024, 2025 and H1 2026 revenue, profit, cash flow and balance-sheet figures." },
  { id: "review", title: "Operating and financial review", text: "Management commentary on utilisation, margins, realised prices, fixed-cost absorption and working capital." },
  { id: "capital", title: "Capitalisation and indebtedness", text: "Cash, borrowings, subsequent financing and leverage disclosures." },
  { id: "risks", title: "Risk factors", text: "Margin cyclicality, crude supply, operations, financing, execution, governance, regulation and trading liquidity." },
  { id: "dividend", title: "Dividend policy", text: "Dividends depend on profits, liquidity, debt restrictions, capital investment and board approval." },
  { id: "retail", title: "Retail investor incentive", text: "Potential one-share awards after each qualifying 12-month holding period, capped at two shares and subject to the offer terms." },
];
