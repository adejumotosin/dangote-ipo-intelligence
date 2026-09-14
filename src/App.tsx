import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, ComposedChart, Legend,
  Line, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Calculator,
  Check, ChevronRight, Clipboard, Database, Download, Fuel, Gauge, Landmark,
  RefreshCw, Scale, ShieldAlert, WalletCards,
} from "lucide-react";
import { HISTORICALS, IPO, PRODUCT_MIX, RISKS, SCENARIOS, SOURCE_NOTES, Scenario } from "./data";
import { calculateScenario, format, reverseExpectations } from "./model";

const MIX_COLORS = ["#e4a93d", "#5d91b8", "#70b69c", "#8c799f", "#cb715f", "#d7c58a"];
const HEAT_GRMS = [10, 14, 18, 22, 26, 30];
const HEAT_UTILS = [70, 80, 90, 95];

type Section = "overview" | "lab" | "calculator" | "sources";
type ChartView = "financials" | "margins";

const controls: Array<{
  key: keyof Scenario; label: string; min: number; max: number; step: number; suffix: string; help: string;
}> = [
  { key: "capacityKbd", label: "Capacity", min: 500, max: 1400, step: 10, suffix: " kbd", help: "Installed crude processing capacity in thousand barrels per day." },
  { key: "utilisation", label: "Utilisation", min: 50, max: 100, step: 1, suffix: "%", help: "Share of installed capacity actually processed through the year." },
  { key: "grm", label: "Gross refining margin", min: 8, max: 35, step: 0.1, suffix: " $/bbl", help: "Refinery-specific product value less crude and variable processing economics per barrel." },
  { key: "usdNgn", label: "USD / NGN", min: 1000, max: 2500, step: 10, suffix: "", help: "Exchange rate used to translate model earnings to Naira." },
  { key: "fixedCostBn", label: "Cash operating cost", min: 0.3, max: 2.5, step: 0.05, suffix: " $bn", help: "Simplified annual cash operating and fixed-cost assumption." },
  { key: "dnaBn", label: "D&A", min: 0.2, max: 2, step: 0.05, suffix: " $bn", help: "Annual depreciation and amortisation assumption." },
  { key: "grossDebtBn", label: "Gross debt", min: 0, max: 20, step: 0.1, suffix: " $bn", help: "Interest-bearing borrowings used in the scenario." },
  { key: "cashBn", label: "Cash", min: 0, max: 10, step: 0.1, suffix: " $bn", help: "Cash balance deducted from gross debt to estimate net debt." },
  { key: "interestRate", label: "Average interest rate", min: 3, max: 15, step: 0.1, suffix: "%", help: "Blended annual interest rate applied to gross debt." },
  { key: "taxRate", label: "Effective tax rate", min: 0, max: 35, step: 0.5, suffix: "%", help: "Simplified effective tax rate applied only when pre-tax income is positive." },
  { key: "targetPE", label: "Valuation multiple", min: 6, max: 20, step: 0.5, suffix: "x", help: "P/E multiple used as one simplified valuation lens." },
];

function SourceChip({ target, label = "Prospectus" }: { target: string; label?: string }) {
  return <a className="source-chip" href={"#source-" + target}>{label}</a>;
}

function MetricCard({ label, value, note, source, tone }: {
  label: string; value: string; note?: string; source?: string; tone?: "good" | "bad";
}) {
  return <article className={"metric-card " + (tone || "")}>
    <div className="metric-top"><span>{label}</span>{source && <SourceChip target={source} />}</div>
    <strong>{value}</strong>{note && <small>{note}</small>}
  </article>;
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="section-title"><span>{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>;
}

function Control({ spec, scenario, setScenario }: {
  spec: (typeof controls)[number]; scenario: Scenario; setScenario: (s: Scenario) => void;
}) {
  const value = scenario[spec.key];
  const update = (next: number) => {
    const safe = Number.isFinite(next) ? Math.min(spec.max, Math.max(spec.min, next)) : spec.min;
    setScenario({ ...scenario, [spec.key]: safe });
  };
  return <div className="control">
    <div className="control-head">
      <label title={spec.help}>{spec.label}<span className="info-dot">i</span></label>
      <div className="number-wrap">
        <input aria-label={spec.label + " value"} type="number" min={spec.min} max={spec.max} step={spec.step}
          value={value} onChange={(e) => update(Number(e.target.value))} /><span>{spec.suffix}</span>
      </div>
    </div>
    <input aria-label={spec.label + " slider"} className="range" type="range" min={spec.min} max={spec.max}
      step={spec.step} value={value} onChange={(e) => update(Number(e.target.value))} />
    <div className="range-ends"><span>{spec.min}</span><span>{spec.max}</span></div>
  </div>;
}

export default function App() {
  const [section, setSection] = useState<Section>("overview");
  const [chartView, setChartView] = useState<ChartView>("financials");
  const [scenarioName, setScenarioName] = useState("Prospectus");
  const [scenario, setScenario] = useState<Scenario>(() => {
    try {
      const saved = localStorage.getItem("dangote-ipo-scenario");
      return saved ? { ...SCENARIOS.Prospectus, ...JSON.parse(saved) } : SCENARIOS.Prospectus;
    } catch { return SCENARIOS.Prospectus; }
  });
  const [amount, setAmount] = useState(500000);
  const [bonus, setBonus] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => calculateScenario(scenario), [scenario]);
  const reverse = useMemo(() => reverseExpectations(scenario), [scenario]);
  const presetOutputs = useMemo(
    () => Object.fromEntries(Object.entries(SCENARIOS).map(([name, values]) => [name, calculateScenario(values)])),
    [],
  );
  useEffect(() => localStorage.setItem("dangote-ipo-scenario", JSON.stringify(scenario)), [scenario]);

  const selectSection = (next: Section) => {
    setSection(next);
    window.setTimeout(() => document.getElementById(next)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const applyPreset = (name: string) => { setScenarioName(name); setScenario({ ...SCENARIOS[name] }); };
  const sharesPurchased = Math.max(0, Math.floor(amount / IPO.price));
  const eligible = sharesPurchased >= 10;
  const outcomeShares = sharesPurchased + (bonus && eligible ? 2 : 0);
  const cashUsed = sharesPurchased * IPO.price;
  const cashLeft = amount - cashUsed;
  const verdict = output.fairValueNgn >= IPO.price * 1.1
    ? "These assumptions provide a valuation cushion above the IPO price."
    : output.fairValueNgn >= IPO.price * 0.9
      ? "These assumptions roughly support the IPO valuation, with limited margin of safety."
      : "Under these assumptions, ₦525 requires more operating strength.";
  const heatValue = (grm: number, utilisation: number) => calculateScenario({ ...scenario, grm, utilisation }).fairValueNgn;

  const exportCsv = () => {
    const rows: Array<[string, string | number]> = [
      ["Metric", "Value"], ["Capacity kbd", scenario.capacityKbd], ["Utilisation %", scenario.utilisation],
      ["GRM USD/bbl", scenario.grm], ["USD/NGN", scenario.usdNgn], ["Cash operating cost USD bn", scenario.fixedCostBn],
      ["D&A USD bn", scenario.dnaBn], ["Gross debt USD bn", scenario.grossDebtBn], ["Cash USD bn", scenario.cashBn],
      ["Interest rate %", scenario.interestRate], ["Tax rate %", scenario.taxRate], ["Target P/E", scenario.targetPE],
      ["Annual processed barrels", output.annualBarrels], ["GRM contribution USD", output.contributionUsd],
      ["EBITDA USD", output.ebitdaUsd], ["PAT USD", output.patUsd], ["PAT NGN", output.patNgn],
      ["EPS NGN", output.epsNgn], ["Model fair value NGN", output.fairValueNgn],
      ["Upside/downside %", output.upside * 100], ["Required GRM USD/bbl", reverse.requiredGrm ?? "Not meaningful"],
    ];
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "dangote-ipo-scenario.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    const text = [
      "Dangote IPO Intelligence", "IPO price: ₦525",
      "Scenario: " + scenario.capacityKbd + " kbd, " + scenario.utilisation + "% utilisation, $" + scenario.grm + "/bbl GRM",
      "FX: ₦" + scenario.usdNgn + "/$", "Estimated PAT: " + format.ngnTn(output.patNgn),
      "EPS: " + format.ngn(output.epsNgn, 2), "Model fair value: " + format.ngn(output.fairValueNgn),
      "Upside/downside: " + format.percent(output.upside),
      "Required GRM to justify ₦525: " + (reverse.requiredGrm ? "$" + reverse.requiredGrm.toFixed(2) + "/bbl" : "Not meaningful"),
      "Educational model, not investment advice.",
    ].join("\n");
    await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };

  const navItems: Array<[Section, string]> = [
    ["overview", "Overview"], ["lab", "Scenario Lab"], ["calculator", "Investment"], ["sources", "Sources"],
  ];
  const waterfall = [
    { name: "GRM bridge", value: output.contributionUsd / 1e9 },
    { name: "EBITDA", value: output.ebitdaUsd / 1e9 },
    { name: "EBIT", value: output.ebitUsd / 1e9 },
    { name: "Pre-tax", value: output.preTaxUsd / 1e9 },
    { name: "PAT", value: output.patUsd / 1e9 },
  ];

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => selectSection("overview")} aria-label="Go to overview">
        <span className="brand-mark"><BarChart3 size={20} /></span><span><b>Dangote IPO</b><small>Intelligence</small></span>
      </button>
      <nav>{navItems.map(([id, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => selectSection(id)}>{label}</button>)}</nav>
      <button className="header-cta" onClick={() => selectSection("lab")}>Open model <ChevronRight size={15} /></button>
    </header>

    <main>
      <section className="hero" id="overview">
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="eyebrow-row"><span>INDEPENDENT INVESTOR TOOL • V1</span><span>MODEL DATE: 14 SEP 2026</span></div>
          <h1>What must go right<br />for <em>₦525</em> to work?</h1>
          <p>Stress-test refinery margins, utilisation, financing and valuation against the IPO price.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => selectSection("lab")}>Stress-test the price <Activity size={17} /></button>
            <button className="secondary" onClick={() => selectSection("sources")}>Review methodology <Database size={17} /></button>
          </div>
        </div>
        <div className="hero-quote"><span>THE INVESTMENT HINGE</span><p>₦525 is a bet that the H1 2026 operating turnaround is reasonably sustainable and that the journey to 1.4m bpd can be financed without excessive debt, dilution or cost overruns.</p></div>
      </section>

      <section className="content-section">
        <div className="kpi-grid six">
          <MetricCard label="IPO price" value="₦525" source="offer" note="Per ordinary share" />
          <MetricCard label="Implied market cap" value="₦65.22tn" source="offer" note="Post-listing" />
          <MetricCard label="Current capacity" value="~700k bpd" source="business" note="Demonstrated June 2026" />
          <MetricCard label="Management 2026 GRM" value="~$24.20/bbl" source="review" note="Market-dependent estimate" />
          <MetricCard label="H1 2026 PAT" value="₦2.50tn" source="financials" note="Six months, not full year" tone="good" />
          <MetricCard label="Simple funding comparison" value="~$12.75bn" source="offer" note="$14.3bn expansion less ~$1.55bn IPO net proceeds" tone="bad" />
        </div>
      </section>

      <section className="content-section split-2">
        <article className="panel chart-panel">
          <div className="panel-head"><div><span className="panel-kicker">OPERATING TRANSFORMATION</span><h3>Audited financial trajectory</h3></div>
            <div className="segmented"><button onClick={() => setChartView("financials")} className={chartView === "financials" ? "active" : ""}>₦ trillion</button><button onClick={() => setChartView("margins")} className={chartView === "margins" ? "active" : ""}>Margins</button></div>
          </div>
          <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%">
            {chartView === "financials" ? <ComposedChart data={HISTORICALS}>
              <CartesianGrid stroke="#25313a" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" stroke="#73808a" tickLine={false} axisLine={false} /><YAxis stroke="#73808a" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#101820", border: "1px solid #2a3741", borderRadius: 8 }} /><Legend /><ReferenceLine y={0} stroke="#6c7780" />
              <Bar dataKey="revenue" name="Revenue" fill="#5d91b8" radius={[3, 3, 0, 0]} /><Bar dataKey="operating" name="Operating profit" fill="#e4a93d" radius={[3, 3, 0, 0]} /><Bar dataKey="pat" name="PAT" fill="#70b69c" radius={[3, 3, 0, 0]} />
            </ComposedChart> : <AreaChart data={HISTORICALS}>
              <defs><linearGradient id="marginFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e4a93d" stopOpacity={0.28}/><stop offset="95%" stopColor="#e4a93d" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke="#25313a" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" stroke="#73808a" tickLine={false} axisLine={false} /><YAxis stroke="#73808a" tickFormatter={(v) => v + "%"} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#101820", border: "1px solid #2a3741", borderRadius: 8 }} /><Legend /><ReferenceLine y={0} stroke="#6c7780" />
              <Area type="monotone" dataKey="grossMargin" name="Gross margin" stroke="#e4a93d" fill="url(#marginFill)" /><Line type="monotone" dataKey="operatingMargin" name="Operating margin" stroke="#5d91b8" strokeWidth={2} /><Line type="monotone" dataKey="netMargin" name="Net margin" stroke="#70b69c" strokeWidth={2} />
            </AreaChart>}
          </ResponsiveContainer></div>
          <div className="chart-note"><AlertTriangle size={14} /> H1 2026 covers six months. It is not directly comparable with a full financial year. <SourceChip target="financials" /></div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><span className="panel-kicker">OUTPUT FLEXIBILITY</span><h3>Production yield mix</h3></div><SourceChip target="business" /></div>
          <div className="mix-layout"><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={PRODUCT_MIX} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>{PRODUCT_MIX.map((_, i) => <Cell key={i} fill={MIX_COLORS[i]} />)}</Pie><Tooltip contentStyle={{ background: "#101820", border: "1px solid #2a3741", borderRadius: 8 }} /></PieChart></ResponsiveContainer><div className="donut-center"><Fuel size={19}/><b>6</b><span>products</span></div></div>
            <div className="legend-list">{PRODUCT_MIX.map((item, i) => <div key={item.name}><span className="legend-dot" style={{ background: MIX_COLORS[i] }} /><span>{item.name}</span><b>{item.value}%</b></div>)}</div>
          </div>
          <p className="panel-foot">12 months to June 2026. The output mix makes a simple 3-2-1 crack spread an imperfect proxy for Dangote's refinery-specific GRM.</p>
        </article>
      </section>

      <section className="content-section">
        <SectionTitle eyebrow="FROM CONSTRUCTION PROJECT TO OPERATING ASSET" title="Operating transformation" />
        <div className="timeline">{[
          ["JAN 2024", "Commercial operations", "Initial commercial production begins."],
          ["MAR 2026", "Stable full-capacity production", "Processing units reach stable full-capacity operations."],
          ["JUN 2026", "Up to 700k bpd", "Prospectus reports demonstrated rates up to capacity."],
          ["2029", "Target ~1.4m bpd", "Second capacity phase targeted for completion."],
          ["2030", "Wider programme", "Broader refinery and petrochemical programme may extend further."],
        ].map((item, i) => <article key={item[0]}><span className="timeline-index">0{i + 1}</span><b>{item[0]}</b><h4>{item[1]}</h4><p>{item[2]}</p></article>)}</div>
      </section>

      <section className="content-section split-2">
        <article className="panel">
          <div className="panel-head"><div><span className="panel-kicker">30 JUNE 2026</span><h3>Balance-sheet snapshot</h3></div><Landmark size={22} /></div>
          <div className="balance-grid"><MetricCard label="Cash" value="$4.27bn" /><MetricCard label="Borrowings" value="~$5.67bn" /><MetricCard label="Net debt" value="~$1.40bn" /><MetricCard label="Net debt / EBITDA" value="0.27x" /><MetricCard label="H1 operating cash flow" value="₦1.751tn" /><MetricCard label="Cash conversion" value="~70%" /></div>
          <div className="chart-note">The June balance sheet precedes a large expansion funding cycle. <SourceChip target="capital" /></div>
        </article>
        <article className="panel">
          <div className="panel-head"><div><span className="panel-kicker">INVESTMENT RISK MAP</span><h3>What can break the thesis?</h3></div><ShieldAlert size={22} /></div>
          <div className="risk-list">{RISKS.map((risk) => <div key={risk.name}><span>{risk.name}</span><b className={"severity " + risk.severity.toLowerCase().replace("-", "").replace(" ", "")}>{risk.severity}</b></div>)}</div>
          <div className="chart-note">Severity ratings are independent assessments based on prospectus disclosures. <SourceChip target="risks" /></div>
        </article>
      </section>

      <section className="model-section" id="lab">
        <div className="model-intro"><SectionTitle eyebrow="SCENARIO LAB" title="Build the earnings case barrel by barrel." copy="Change one assumption and see how it transmits into profit, leverage and model fair value." /><button className="secondary" onClick={() => applyPreset("Prospectus")}><RefreshCw size={15}/> Reset to prospectus case</button></div>
        <div className="preset-row">{Object.keys(SCENARIOS).map((name) => <button key={name} className={scenarioName === name ? "active" : ""} onClick={() => applyPreset(name)}><span>{name}</span><small>{SCENARIOS[name].utilisation}% util. • {"$"}{SCENARIOS[name].grm}/bbl</small></button>)}</div>
        <div className="lab-layout">
          <aside className="controls-panel"><div className="controls-title"><div className="sliders-icon"><i/><i/><i/></div><div><span>USER ASSUMPTIONS</span><b>{scenarioName} case</b></div></div>{controls.map((spec) => <Control key={spec.key} spec={spec} scenario={scenario} setScenario={(next) => { setScenario(next); setScenarioName("Custom"); }} />)}</aside>
          <div className="results">
            <div className="verdict"><div className={output.upside >= 0 ? "verdict-icon good" : "verdict-icon bad"}>{output.upside >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}</div><div><span>MODEL VERDICT</span><h3>{verdict}</h3><p>Model fair value <b>{format.ngn(output.fairValueNgn)}</b>, {format.percent(output.upside)} versus ₦525.</p></div></div>
            <div className="kpi-grid four output-grid">
              <MetricCard label="Processed barrels" value={format.number(output.annualBarrels / 1e6) + "m"} note="Annualised throughput" />
              <MetricCard label="GRM contribution" value={format.usdBn(output.contributionUsd)} note="Not revenue or accounting gross profit" />
              <MetricCard label="EBITDA estimate" value={format.usdBn(output.ebitdaUsd)} note="Simplified model output" tone={output.ebitdaUsd >= 0 ? "good" : "bad"} />
              <MetricCard label="PAT estimate" value={format.ngnTn(output.patNgn)} note={format.usdBn(output.patUsd)} tone={output.patUsd >= 0 ? "good" : "bad"} />
              <MetricCard label="EPS" value={format.ngn(output.epsNgn, 2)} note="Post-listing shares" />
              <MetricCard label="P/E at ₦525" value={output.impliedPE ? output.impliedPE.toFixed(1) + "x" : "N/M"} note="Not meaningful when EPS is negative" />
              <MetricCard label="Model fair value" value={format.ngn(output.fairValueNgn)} note={scenario.targetPE + "x P/E lens"} tone={output.fairValueNgn >= IPO.price ? "good" : "bad"} />
              <MetricCard label="Net debt / EBITDA" value={output.netDebtToEbitda === null ? "N/M" : output.netDebtToEbitda.toFixed(2) + "x"} note={"Net debt " + format.usdBn(output.netDebtUsd)} />
            </div>
            {(output.patUsd < 0 || output.ebitdaUsd <= 0) && <div className="warning"><AlertTriangle size={18}/><span>{output.ebitdaUsd <= 0 ? "EBITDA is non-positive, so leverage ratios are not meaningful." : "This scenario produces a net loss, so P/E valuation is not meaningful."}</span></div>}

            <div className="split-2 model-charts">
              <article className="panel">
                <div className="panel-head"><div><span className="panel-kicker">EARNINGS BRIDGE</span><h3>From GRM to PAT</h3></div><span className="calculated-chip">Calculated</span></div>
                <div className="chart-wrap short"><ResponsiveContainer width="100%" height="100%"><BarChart data={waterfall}><CartesianGrid stroke="#25313a" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" stroke="#73808a" tickLine={false} axisLine={false} fontSize={11}/><YAxis stroke="#73808a" tickLine={false} axisLine={false} unit="bn"/><Tooltip formatter={(v: number) => "$" + v.toFixed(2) + "bn"} contentStyle={{ background: "#101820", border: "1px solid #2a3741", borderRadius: 8 }}/><ReferenceLine y={0} stroke="#6c7780"/><Bar dataKey="value" radius={[4,4,0,0]}>{waterfall.map((item, i) => <Cell key={i} fill={item.value >= 0 ? (i === 0 ? "#e4a93d" : "#70b69c") : "#cb6158"}/>)}</Bar></BarChart></ResponsiveContainer></div>
                <p className="panel-foot">The GRM bridge equals annual processed barrels × GRM. It is not revenue, EBITDA or accounting gross profit.</p>
              </article>
              <article className="panel">
                <div className="panel-head"><div><span className="panel-kicker">VALUATION DISTANCE</span><h3>Model fair value vs IPO price</h3></div><Scale size={21}/></div>
                <div className="gauge-value">{format.ngn(output.fairValueNgn)}</div><div className="gauge-track"><div className="gauge-fill" style={{ width: Math.min(100, output.fairValueNgn / 10) + "%" }} /><div className="ipo-marker" style={{ left: "52.5%" }}><span>₦525 IPO</span></div></div><div className="gauge-scale"><span>₦0</span><span>₦500</span><span>₦1,000+</span></div>
                <div className={"valuation-callout " + (output.upside >= 0 ? "positive" : "negative")}>{output.upside >= 0 ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}<b>{format.percent(output.upside)}</b><span>model upside / downside</span></div>
                <p className="panel-foot">This is a simplified P/E valuation lens, not a target price or investment recommendation.</p>
              </article>
            </div>

            <article className="panel expectations">
              <div className="expectation-icon"><Gauge /></div><div><span className="panel-kicker">REVERSE EXPECTATIONS</span><h3>What is ₦525 assuming?</h3><p>Instead of forecasting a price, solve backwards for the earnings and refinery margin needed to support the IPO valuation.</p></div>
              <div className="expectation-stat"><span>Required annual PAT</span><b>{format.ngnTn(reverse.requiredPatNgn)}</b><small>{format.usdBn(reverse.requiredPatUsd)}</small></div>
              <div className="expectation-stat"><span>Required sustainable GRM</span><b>{reverse.requiredGrm ? "$" + reverse.requiredGrm.toFixed(2) + "/bbl" : "N/M"}</b><small>{reverse.gap === null ? "Cannot calculate" : (reverse.gap > 0 ? "$" + reverse.gap.toFixed(2) + " above your case" : "$" + Math.abs(reverse.gap).toFixed(2) + " below your case")}</small></div>
              <div className="expectation-read">{reverse.gap !== null && (reverse.gap > 0 ? "Your current GRM assumption does not fully support ₦525 at the selected P/E. Either margins, utilisation or the valuation multiple must be stronger, or costs and financing must be lower." : "Your assumptions exceed the operating threshold required by this simplified model, creating a valuation cushion.")}</div>
            </article>

            <article className="panel">
              <div className="panel-head"><div><span className="panel-kicker">TWO-WAY SENSITIVITY</span><h3>Model fair value by GRM and utilisation</h3></div><span className="assumption-chip">Other inputs held constant</span></div>
              <div className="heat-scroll"><table className="heatmap"><thead><tr><th>GRM ↓ / Util. →</th>{HEAT_UTILS.map((u) => <th key={u}>{u}%</th>)}</tr></thead><tbody>{HEAT_GRMS.map((g) => <tr key={g}><th>{"$"}{g}/bbl</th>{HEAT_UTILS.map((u) => { const value = heatValue(g, u); const ratio = value / IPO.price; return <td key={u} className={ratio >= 1.1 ? "heat-good" : ratio >= 0.8 ? "heat-mid" : "heat-bad"}>{format.ngn(value)}</td>; })}</tr>)}</tbody></table></div>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section" id="calculator">
        <SectionTitle eyebrow="PERSONAL INVESTMENT CALCULATOR" title="Translate the thesis into your own Naira." copy="See how many shares your capital buys and how each scenario changes the gross portfolio value." />
        <div className="calculator-layout">
          <article className="panel invest-input"><label>Investment amount</label><div className="money-input"><span>₦</span><input type="number" min="0" step="525" value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}/></div>
            <div className="quick-row">{[100000, 500000, 1000000].map((v) => <button key={v} onClick={() => setAmount(v)} className={amount === v ? "active" : ""}>{format.ngn(v)}</button>)}</div>
            <div className="purchase-summary"><div><span>Shares purchased</span><b>{format.number(sharesPurchased, 0)}</b></div><div><span>Cash used</span><b>{format.ngn(cashUsed)}</b></div><div><span>Cash remaining</span><b>{format.ngn(cashLeft)}</b></div></div>
            <label className={"bonus-toggle " + (!eligible ? "disabled" : "")}><input type="checkbox" checked={bonus && eligible} disabled={!eligible} onChange={(e) => setBonus(e.target.checked)}/><span className="switch" /><span><b>Include two potential bonus shares</b><small>Illustrative 24-month outcome, subject to continuous holding and the offer terms.</small></span></label>
            {!eligible && <p className="eligibility-note">At least 10 shares are required for potential retail incentive eligibility.</p>}
          </article>
          <article className="panel outcome-panel">
            <div className="panel-head"><div><span className="panel-kicker">SCENARIO OUTCOMES</span><h3>{format.number(outcomeShares, 0)} shares after selected incentive</h3></div><WalletCards size={22}/></div>
            <div className="table-scroll"><table className="outcome-table"><thead><tr><th>Scenario</th><th>Model fair price</th><th>Gross value</th><th>Gain / loss</th><th>Return</th></tr></thead><tbody>
              {["Bear", "Base", "Bull"].map((name) => { const price = presetOutputs[name].fairValueNgn; const value = outcomeShares * price; const gain = value - cashUsed; return <tr key={name}><td><span className={"scenario-dot " + name.toLowerCase()} />{name}</td><td>{format.ngn(price)}</td><td>{format.ngn(value)}</td><td className={gain >= 0 ? "positive-text" : "negative-text"}>{format.ngn(gain)}</td><td className={gain >= 0 ? "positive-text" : "negative-text"}>{cashUsed > 0 ? format.percent(gain / cashUsed) : "0.0%"}</td></tr>; })}
              {(() => { const value = outcomeShares * output.fairValueNgn; const gain = value - cashUsed; return <tr className="current-row"><td><span className="scenario-dot current"/>Current model</td><td>{format.ngn(output.fairValueNgn)}</td><td>{format.ngn(value)}</td><td className={gain >= 0 ? "positive-text" : "negative-text"}>{format.ngn(gain)}</td><td className={gain >= 0 ? "positive-text" : "negative-text"}>{cashUsed > 0 ? format.percent(gain / cashUsed) : "0.0%"}</td></tr>; })()}
            </tbody></table></div><p className="panel-foot">These values apply model fair prices, not price forecasts. Dividends, taxes, fees and market liquidity are excluded.</p>
          </article>
        </div>
      </section>

      <section className="sources-section" id="sources">
        <div className="sources-head"><SectionTitle eyebrow="SOURCES & METHODOLOGY" title="Every output should be traceable." copy="Primary source: Dangote Petroleum Refinery and Petrochemicals FZE IPO Prospectus (2026)." /><div className="source-actions"><button className="secondary" onClick={copySummary}>{copied ? <Check size={16}/> : <Clipboard size={16}/>} {copied ? "Copied" : "Copy analysis"}</button><button className="primary" onClick={exportCsv}><Download size={16}/> Download CSV</button></div></div>
        <div className="source-grid">{SOURCE_NOTES.map((source) => <details key={source.id} id={"source-" + source.id} className="source-card"><summary><span><Database size={16}/>{source.title}</span><ChevronRight size={16}/></summary><p>{source.text}</p><small>Prospectus figure</small></details>)}</div>
        <article className="panel methodology"><div className="panel-head"><div><span className="panel-kicker">DERIVED BY THIS APP</span><h3>Calculation map</h3></div><Calculator size={22}/></div>
          <div className="table-scroll"><table><thead><tr><th>Output</th><th>Method</th><th>Classification</th></tr></thead><tbody>{[
            ["Post-listing shares", "₦65.22tn implied market cap ÷ ₦525 IPO price", "Calculated"],
            ["Simple expansion funding comparison", "$14.3bn programme less ~$1.55bn net IPO proceeds", "Calculated"],
            ["Annual processed barrels", "Capacity × utilisation × 365", "Calculated"],
            ["GRM contribution", "Annual processed barrels × GRM", "Calculated"],
            ["EPS", "Model PAT in Naira ÷ post-listing shares", "Calculated"],
            ["Model fair value", "EPS × user-selected P/E multiple", "User assumption"],
            ["Required GRM", "Reverse-solved from ₦525, P/E, tax, cost and financing inputs", "Calculated"],
          ].map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td><span className={row[2] === "Calculated" ? "calculated-chip" : "assumption-chip"}>{row[2]}</span></td></tr>)}</tbody></table></div>
        </article>
      </section>
    </main>
    <footer><div><b>Dangote IPO Intelligence</b><span>Independent investor analytics</span></div><p>Educational model, not investment advice. Outputs are estimates based on user assumptions and simplified relationships. Not affiliated with Dangote Group, NGX or the offer parties.</p></footer>
  </div>;
}
