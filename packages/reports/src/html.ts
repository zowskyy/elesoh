import type { AiNarrative } from '@lso/ai';

export interface ReportFinding {
  ruleId: string;
  outcome: string;
  summary: string;
}

export interface ReportRecommendation {
  priority: string;
  action: string;
}

export interface ReportModel {
  auditId: string;
  websiteUrl: string;
  businessName?: string;
  generatedAt: string;
  scores: {
    overall: number;
    seo: number;
    performance: number | null;
  };
  narrative: AiNarrative;
  narrativeSource: 'ollama' | 'fallback';
  findings: ReportFinding[];
  recommendations: ReportRecommendation[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderHtmlReport(model: ReportModel): string {
  const findings = model.findings
    .filter((finding) => finding.outcome === 'FAIL' || finding.outcome === 'WARN' || finding.outcome === 'ERROR')
    .slice(0, 50)
    .map(
      (finding) =>
        `<tr><td>${escapeHtml(finding.ruleId)}</td><td>${escapeHtml(finding.outcome)}</td><td>${escapeHtml(finding.summary)}</td></tr>`,
    )
    .join('\n');

  const recs = model.recommendations
    .slice(0, 20)
    .map(
      (rec) =>
        `<li><strong>${escapeHtml(rec.priority)}</strong> — ${escapeHtml(rec.action)}</li>`,
    )
    .join('\n');

  const actions = model.narrative.topActions
    .map(
      (action) =>
        `<li><code>${escapeHtml(action.ruleId)}</code> — ${escapeHtml(action.explanation)}</li>`,
    )
    .join('\n');

  const highlights = model.narrative.highlights
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('\n');

  const caveats = model.narrative.caveats
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('\n');

  const business =
    model.businessName !== undefined && model.businessName.trim() !== ''
      ? `<p class="muted">Business: ${escapeHtml(model.businessName)}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>LocalSite Optimizer Report</title>
  <style>
    :root { color-scheme: light; --ink:#14213d; --muted:#5c6b7a; --line:#d7dee7; --bg:#f7f9fc; --accent:#0b6e4f; }
    body { margin:0; font-family: "Segoe UI", "Helvetica Neue", sans-serif; color:var(--ink); background:linear-gradient(180deg,#eef3f8,var(--bg)); }
    main { max-width: 920px; margin: 0 auto; padding: 48px 24px 80px; }
    h1 { font-size: 2rem; margin: 0 0 8px; letter-spacing: -0.03em; }
    h2 { margin-top: 36px; font-size: 1.25rem; }
    .muted { color: var(--muted); }
    .score { display:flex; gap:16px; flex-wrap:wrap; margin: 24px 0; }
    .score div { background:#fff; border:1px solid var(--line); border-radius:12px; padding:16px 20px; min-width:120px; }
    .score strong { display:block; font-size:1.8rem; color:var(--accent); }
    table { width:100%; border-collapse:collapse; background:#fff; }
    th, td { border:1px solid var(--line); padding:10px 12px; text-align:left; font-size:0.95rem; }
    th { background:#edf2f7; }
    ul { line-height:1.5; }
    .badge { display:inline-block; padding:4px 8px; border-radius:999px; background:#e6f4ef; color:var(--accent); font-size:0.8rem; }
  </style>
</head>
<body>
  <main>
    <p class="badge">LocalSite Optimizer</p>
    <h1>Website audit report</h1>
    <p class="muted">Audit ${escapeHtml(model.auditId)} · ${escapeHtml(model.generatedAt)}</p>
    <p>Website: <strong>${escapeHtml(model.websiteUrl)}</strong></p>
    ${business}
    <div class="score">
      <div><span class="muted">Overall</span><strong>${model.scores.overall}</strong></div>
      <div><span class="muted">SEO</span><strong>${model.scores.seo}</strong></div>
      <div><span class="muted">Performance</span><strong>${model.scores.performance === null ? 'n/a' : model.scores.performance}</strong></div>
    </div>
    <h2>Executive summary</h2>
    <p>${escapeHtml(model.narrative.executiveSummary)}</p>
    <p class="muted">Narrative source: ${escapeHtml(model.narrativeSource)}</p>
    <h2>Highlights</h2>
    <ul>${highlights}</ul>
    <h2>Top actions</h2>
    <ul>${actions}</ul>
    <h2>Recommendations</h2>
    <ul>${recs}</ul>
    <h2>Findings (FAIL / WARN / ERROR)</h2>
    <table>
      <thead><tr><th>Rule</th><th>Outcome</th><th>Summary</th></tr></thead>
      <tbody>${findings}</tbody>
    </table>
    <h2>Caveats</h2>
    <ul>${caveats}</ul>
  </main>
</body>
</html>`;
}
