"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Check, ChevronRight, CircleAlert, Clock3, ImageIcon, LoaderCircle, Plus, RotateCcw, Sparkles, Target, X } from "lucide-react";
import type { CampaignFields, CampaignRun, CompanyFields } from "../lib/types";

type Tab = "new" | "pending" | "completed";
const initialCompany: CompanyFields = { companyName: "", productName: "", productType: "", pricePoint: "", targetCustomer: "", visualIdentity: "", valueProposition: "", tone: "" };
const initialCampaign: CampaignFields = { campaignName: "", funnelStage: "Awareness", offer: "", season: "", messageAngle: "", audienceSegment: "", objective: "", placement: "Instagram feed", aspectRatio: "1:1", additionalConstraints: "" };
const statusCopy: Record<string, string> = { queued: "Queued", generating_context: "Writing creative brief", generating_upgrade: "Analyzing performance", generating_image: "Generating image", completed: "Completed", failed: "Needs attention" };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="field"><span className="field-label">{label}{required && <em>Required</em>}</span>{children}</label>;
}
function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "warning" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{body}</p></div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("new");
  const [company, setCompany] = useState(initialCompany);
  const [campaign, setCampaign] = useState(initialCampaign);
  const [runs, setRuns] = useState<CampaignRun[]>([]);
  const [selected, setSelected] = useState<CampaignRun | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    try {
      const response = await fetch("/api/runs", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { runs: CampaignRun[] };
      setRuns(data.runs);
      setSelected((current) => current ? data.runs.find((run) => run.id === current.id) || null : null);
    } catch { /* polling retries automatically */ }
  }, []);
  useEffect(() => { void loadRuns(); }, [loadRuns]);
  useEffect(() => {
    if (!runs.some((run) => !["completed", "failed"].includes(run.status))) return;
    const timer = window.setInterval(() => void loadRuns(), 2000);
    return () => window.clearInterval(timer);
  }, [runs, loadRuns]);

  const pending = useMemo(() => runs.filter((run) => run.status !== "completed"), [runs]);
  const completed = useMemo(() => runs.filter((run) => run.status === "completed"), [runs]);

  async function createCampaign(event: React.FormEvent) {
    event.preventDefault(); setSubmitting(true); setMessage(null);
    try {
      const response = await fetch("/api/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, campaign }) });
      const result = (await response.json()) as { run?: CampaignRun; error?: string };
      if (!response.ok || !result.run) throw new Error(result.error || "Could not create campaign");
      setRuns((current) => [result.run!, ...current]); setTab("pending"); setCompany(initialCompany); setCampaign(initialCampaign);
      void fetch(`/api/runs/${result.run.id}/generate`, { method: "POST" }).finally(loadRuns);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create campaign"); }
    finally { setSubmitting(false); }
  }
  function startOptimization(run: CampaignRun) {
    setSelected(null); setTab("pending");
    setRuns((current) => current.map((item) => item.id === run.id ? { ...item, status: "generating_upgrade", currentIteration: 1 } : item));
    void fetch(`/api/runs/${run.id}/optimize`, { method: "POST" }).finally(loadRuns);
  }
  function retry(run: CampaignRun) {
    setRuns((current) => current.map((item) => item.id === run.id ? { ...item, status: "queued", errorMessage: null } : item));
    void fetch(`/api/runs/${run.id}/${run.currentIteration === 1 ? "optimize" : "generate"}`, { method: "POST" }).finally(loadRuns);
  }
  async function resetDemo() {
    if (!window.confirm("Reset the demo and remove all campaign runs?")) return;
    await fetch("/api/demo/reset", { method: "POST" }); setRuns([]); setSelected(null); setTab("new");
  }

  return <main>
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><Sparkles size={17} /></span><span>Iteration</span></a><div className="topbar-actions"><span className="demo-status"><i /> Demo environment</span><button className="button button-ghost" onClick={resetDemo}><RotateCcw size={15} /> Reset demo</button></div></header>
    <section className="workspace" id="top">
      <div className="hero"><div><Badge>Creative performance lab</Badge><h1>Build the ad. Learn from it.<br /><span>Make the next one sharper.</span></h1><p>Turn brand context into campaign-ready creative, then use performance signals to guide one focused iteration.</p></div><div className="hero-stat"><span>Demo cycle</span><strong>2</strong><small>creative iterations</small></div></div>
      <nav className="tabs" aria-label="Campaign workflow">{(["new", "pending", "completed"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "new" ? <Plus size={16} /> : item === "pending" ? <Clock3 size={16} /> : <Check size={16} />}{item[0].toUpperCase() + item.slice(1)}{item === "pending" && pending.length > 0 && <span>{pending.length}</span>}{item === "completed" && completed.length > 0 && <span>{completed.length}</span>}</button>)}</nav>

      {tab === "new" && <form className="form-shell" onSubmit={createCampaign}>
        <SectionHeading number="01" title="Company context" copy="Give the creative model a clear view of the product and brand." />
        <div className="form-grid">
          <Field label="Company name" required><input required placeholder="e.g. Northline" value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} /></Field>
          <Field label="Product name" required><input required placeholder="e.g. Pace One" value={company.productName} onChange={(e) => setCompany({ ...company, productName: e.target.value })} /></Field>
          <Field label="Product type" required><input required placeholder="e.g. Everyday running shoe" value={company.productType} onChange={(e) => setCompany({ ...company, productType: e.target.value })} /></Field>
          <Field label="Price point" required><input required placeholder="e.g. $129 / accessible premium" value={company.pricePoint} onChange={(e) => setCompany({ ...company, pricePoint: e.target.value })} /></Field>
          <Field label="Target customer" required><textarea required placeholder="Who is this product made for?" value={company.targetCustomer} onChange={(e) => setCompany({ ...company, targetCustomer: e.target.value })} /></Field>
          <Field label="Visual identity" required><textarea required placeholder="Color, photography, composition, references…" value={company.visualIdentity} onChange={(e) => setCompany({ ...company, visualIdentity: e.target.value })} /></Field>
          <Field label="Value proposition" required><textarea required placeholder="The primary reason to choose this product" value={company.valueProposition} onChange={(e) => setCompany({ ...company, valueProposition: e.target.value })} /></Field>
          <Field label="Tone" required><input required placeholder="e.g. Energetic, candid, optimistic" value={company.tone} onChange={(e) => setCompany({ ...company, tone: e.target.value })} /></Field>
        </div>
        <div className="section-rule" /><SectionHeading number="02" title="Campaign strategy" copy="Define the message, audience, and job this creative needs to do." />
        <div className="form-grid">
          <Field label="Campaign name" required><input required placeholder="e.g. Back-to-school launch" value={campaign.campaignName} onChange={(e) => setCampaign({ ...campaign, campaignName: e.target.value })} /></Field>
          <Field label="Funnel stage" required><select value={campaign.funnelStage} onChange={(e) => setCampaign({ ...campaign, funnelStage: e.target.value })}><option>Awareness</option><option>Consideration</option><option>Conversion</option><option>Retention</option></select></Field>
          <Field label="Offer"><input placeholder="e.g. 25% off" value={campaign.offer} onChange={(e) => setCampaign({ ...campaign, offer: e.target.value })} /></Field>
          <Field label="Season"><input placeholder="e.g. Black Friday" value={campaign.season} onChange={(e) => setCampaign({ ...campaign, season: e.target.value })} /></Field>
          <Field label="Message angle" required><textarea required placeholder="What is the creative idea or hook?" value={campaign.messageAngle} onChange={(e) => setCampaign({ ...campaign, messageAngle: e.target.value })} /></Field>
          <Field label="Audience segment" required><textarea required placeholder="Which subset of the target customer?" value={campaign.audienceSegment} onChange={(e) => setCampaign({ ...campaign, audienceSegment: e.target.value })} /></Field>
          <Field label="Objective" required><input required placeholder="e.g. Drive qualified product-page visits" value={campaign.objective} onChange={(e) => setCampaign({ ...campaign, objective: e.target.value })} /></Field>
          <Field label="Placement" required><select value={campaign.placement} onChange={(e) => setCampaign({ ...campaign, placement: e.target.value })}><option>Instagram feed</option><option>Instagram story</option><option>Display ad</option><option>Paid social</option></select></Field>
          <Field label="Aspect ratio" required><select value={campaign.aspectRatio} onChange={(e) => setCampaign({ ...campaign, aspectRatio: e.target.value })}><option>1:1</option><option>4:5</option><option>9:16</option><option>16:9</option></select></Field>
          <Field label="Additional constraints"><textarea placeholder="Anything the model must include or avoid" value={campaign.additionalConstraints} onChange={(e) => setCampaign({ ...campaign, additionalConstraints: e.target.value })} /></Field>
        </div>
        {message && <div className="inline-error"><CircleAlert size={17} />{message}</div>}
        <div className="form-submit"><div><Sparkles size={17} /><span>Iteration 0 creates the baseline. Performance data unlocks iteration 1.</span></div><button className="button button-primary" disabled={submitting} type="submit">{submitting ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />} Generate ad <ArrowRight size={17} /></button></div>
      </form>}

      {tab === "pending" && <section className="panel-list"><ListHeading title="In progress" copy="Creative generation updates automatically." />{pending.length === 0 ? <EmptyState icon={<Clock3 />} title="Nothing is pending" body="New creative jobs will appear here while the models are working." /> : pending.map((run) => <article className="job-card" key={run.id}><div className={`job-icon ${run.status === "failed" ? "job-icon-error" : ""}`}>{run.status === "failed" ? <CircleAlert /> : <LoaderCircle className="spin" />}</div><div className="job-copy"><div><h3>{run.campaign.campaignName}</h3><Badge tone={run.status === "failed" ? "warning" : "default"}>{statusCopy[run.status]}</Badge></div><p>{run.company.companyName} · {run.company.productName}</p><small>Iteration {run.currentIteration} · {run.campaign.aspectRatio} · {run.campaign.placement}</small>{run.errorMessage && <div className="error-text">{run.errorMessage}</div>}</div>{run.status === "failed" ? <button className="button button-secondary" onClick={() => retry(run)}>Retry</button> : <div className="progress-track"><i /></div>}</article>)}</section>}

      {tab === "completed" && <section className="panel-list"><ListHeading title="Completed creative" copy="Open a campaign to inspect its inputs, prompts, and performance-informed changes." />{completed.length === 0 ? <EmptyState icon={<ImageIcon />} title="No creative yet" body="Your generated ads will collect here once the first iteration is complete." /> : <div className="completed-grid">{completed.map((run) => <button className="creative-card" key={run.id} onClick={() => setSelected(run)}><div className="creative-image"><img src={run.image1 || run.image0 || ""} alt={`Generated ad for ${run.company.productName}`} /><span>Iteration {run.image1 ? 1 : 0}</span></div><div className="creative-body"><div><span>{run.company.companyName}</span><Badge tone="success"><Check size={11} /> Complete</Badge></div><h3>{run.campaign.campaignName}</h3><p>{run.company.productName} · {run.campaign.funnelStage}</p><footer><span>{run.image1 ? "2 iterations" : "Baseline ready"}</span><ChevronRight size={17} /></footer></div></button>)}</div>}</section>}
    </section>
    {selected && <RunDetail run={selected} onClose={() => setSelected(null)} onOptimize={() => startOptimization(selected)} />}
  </main>;
}

function SectionHeading({ number, title, copy }: { number: string; title: string; copy: string }) { return <div className="form-heading"><div><span className="step-number">{number}</span><div><h2>{title}</h2><p>{copy}</p></div></div></div>; }
function ListHeading({ title, copy }: { title: string; copy: string }) { return <div className="list-heading"><div><h2>{title}</h2><p>{copy}</p></div></div>; }

function RunDetail({ run, onClose, onOptimize }: { run: CampaignRun; onClose: () => void; onOptimize: () => void }) {
  const metrics = run.metrics;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label={`${run.campaign.campaignName} details`}>
    <header className="modal-header"><div><span>{run.company.companyName} / {run.company.productName}</span><h2>{run.campaign.campaignName}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close details"><X /></button></header>
    <div className="modal-content">
      <div className="context-strip"><div><Target size={17} /><span>Objective</span><strong>{run.campaign.objective}</strong></div><div><BarChart3 size={17} /><span>Funnel stage</span><strong>{run.campaign.funnelStage}</strong></div><div><ImageIcon size={17} /><span>Placement</span><strong>{run.campaign.placement} · {run.campaign.aspectRatio}</strong></div></div>
      <div className={`iteration-grid ${run.image1 ? "has-comparison" : ""}`}><IterationCard number={0} image={run.image0!} context={run.context0!} label="Baseline creative" />{run.image1 && run.context1 && <IterationCard number={1} image={run.image1} context={run.context1} label="Performance-informed" />}</div>
      {metrics && <section className="performance-section"><div className="section-title"><div><span className="section-icon"><BarChart3 size={18} /></span><div><h3>Mock performance signal</h3><p>Predefined demo data returned after iteration 0.</p></div></div><Badge>Iteration 0</Badge></div><div className="metrics-grid"><Metric label="Click-through rate" value={`${(metrics.ctr * 100).toFixed(1)}%`} note="Primary creative signal" /><Metric label="Conversion rate" value={`${(metrics.cvr * 100).toFixed(1)}%`} note="Secondary, less direct signal" /><Metric label="Cost per acquisition" value={`$${(metrics.cpaCents / 100).toFixed(2)}`} note="Context only · media-cost dependent" /></div><div className="signal-note"><CircleAlert size={18} /><p><strong>How the optimizer reads this:</strong> CTR is most useful for diagnosing the creative itself. CVR is treated cautiously because post-click experience also matters. CPA is not used to diagnose creative problems because the cost of ad space materially influences it.</p></div>{run.metricInterpretation && <div className="analysis-copy"><span>Metric interpretation</span><p>{run.metricInterpretation}</p></div>}{run.adjustmentSummary && <div className="analysis-copy"><span>Adjustments made</span><p>{run.adjustmentSummary}</p></div>}</section>}
      <details className="input-details"><summary>View all campaign inputs <ChevronRight size={16} /></summary><div className="input-grid">{[...Object.entries(run.company), ...Object.entries(run.campaign)].filter(([, value]) => value).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><p>{value}</p></div>)}</div></details>
    </div>
    {!run.image1 && <footer className="modal-footer"><div><strong>Ready for iteration 1</strong><span>Use the mock signals to make one targeted creative upgrade.</span></div><button className="button button-primary" onClick={onOptimize}><Sparkles size={17} /> Run optimized iteration <ArrowRight size={17} /></button></footer>}
  </section></div>;
}

function IterationCard({ number, image, context, label }: { number: number; image: string; context: string; label: string }) {
  return <article className="iteration-card"><div className="iteration-label"><span>0{number + 1}</span><div><strong>Iteration {number}</strong><small>{label}</small></div></div><img src={image} alt={`${label} generated ad`} /><details><summary>Generation context <ChevronRight size={15} /></summary><p>{context}</p></details></article>;
}
