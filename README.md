# Dangote IPO Intelligence

Independent, expectations-based investor analytics for Dangote Petroleum Refinery's 2026 IPO.

**Live app:** https://dangote-ipo-intelligence.vercel.app

## V1 features

- Prospectus and audited historical-financial dashboard
- Refinery capacity, utilisation and GRM scenario engine
- Debt, interest, FX, tax and valuation assumptions
- EPS, implied P/E and model fair value calculations
- Reverse expectations analysis for the ₦525 IPO price
- GRM and utilisation sensitivity heatmap
- Personal investment and retail-incentive calculator
- CSV export, copyable analysis and source methodology

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Model boundary

Gross refinery contribution is calculated as annual processed barrels × GRM. It is not revenue, EBITDA or accounting gross profit. The model uses a simplified P/E valuation lens and is provided for education, not investment advice.

## Primary source

Dangote Petroleum Refinery and Petrochemicals FZE IPO Prospectus (2026), including the offer summary, business description, audited historical financial information, operating and financial review, capitalisation and indebtedness, risk factors, dividend policy and retail investor incentive sections.
