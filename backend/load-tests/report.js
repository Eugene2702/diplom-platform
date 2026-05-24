/**
 * Combine one or more Artillery JSON reports into a single HTML page.
 *
 * Usage:
 *   node load-tests/report.js load-tests/last-report.json [load-tests/sync-report.json] ...
 *
 * The output is written to load-tests/report.html and contains:
 *   - one summary table per input report
 *   - one per-endpoint latency table (min / mean / p50 / p95 / p99 / max)
 *
 * Artillery 2.x removed the built-in `artillery report` command in favour of
 * Artillery Cloud — this is a self-contained replacement suitable for the ВКР.
 */
const fs = require('fs');
const path = require('path');

function fmtNum(n) {
  if (n == null) return '—';
  if (typeof n !== 'number') return String(n);
  return Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
}

function loadReport(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return { file: path.basename(file), agg: raw.aggregate };
}

function endpointRows(agg) {
  const summaries = agg.summaries || {};
  return Object.entries(summaries)
    .filter(([k]) => k.startsWith('plugins.metrics-by-endpoint.response_time'))
    .map(([k, s]) => ({
      endpoint: k.replace('plugins.metrics-by-endpoint.response_time.', ''),
      min: fmtNum(s.min),
      mean: fmtNum(s.mean),
      p50: fmtNum(s.median),
      p95: fmtNum(s.p95),
      p99: fmtNum(s.p99),
      max: fmtNum(s.max),
    }));
}

function buildHtml(reports) {
  const blocks = reports
    .map(({ file, agg }) => {
      const c = agg.counters || {};
      const total = c['http.requests'] || 0;
      const ok = c['http.codes.200'] || 0;
      const failed = c['vusers.failed'] || 0;
      const rate = c['http.request_rate'] != null ? c['http.request_rate'] : '—';

      const rows = endpointRows(agg)
        .map(
          (r) => `
        <tr>
          <td class="ep">${r.endpoint}</td>
          <td>${r.min}</td>
          <td><strong>${r.mean}</strong></td>
          <td>${r.p50}</td>
          <td>${r.p95}</td>
          <td>${r.p99}</td>
          <td>${r.max}</td>
        </tr>`
        )
        .join('');

      return `
    <section>
      <h2>${file}</h2>
      <div class="summary">
        <div><span>Всего запросов</span><b>${total}</b></div>
        <div><span>HTTP 200</span><b>${ok}</b></div>
        <div><span>Ошибок</span><b class="${failed > 0 ? 'bad' : 'good'}">${failed}</b></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Эндпоинт</th>
            <th>min, мс</th>
            <th>avg, мс</th>
            <th>p50, мс</th>
            <th>p95, мс</th>
            <th>p99, мс</th>
            <th>max, мс</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>DiplomaHub — Load test report</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0f1115;
    color: #e7e9ee;
    margin: 0;
    padding: 32px 48px 64px;
  }
  h1 { font-weight: 700; letter-spacing: -0.5px; margin: 0 0 8px; }
  h1 + p { color: #8a92a6; margin: 0 0 32px; }
  section { background: #181b22; border-radius: 12px; padding: 24px 28px; margin-bottom: 24px; }
  h2 { margin: 0 0 16px; font-size: 16px; color: #c0c6d5; font-family: ui-monospace, monospace; font-weight: 500; }
  .summary { display: flex; gap: 24px; margin-bottom: 16px; }
  .summary div { background: #20242d; padding: 12px 16px; border-radius: 8px; min-width: 120px; }
  .summary span { display: block; font-size: 11px; color: #7d8499; text-transform: uppercase; letter-spacing: 1px; }
  .summary b { font-size: 20px; font-weight: 600; }
  .summary b.good { color: #4ade80; }
  .summary b.bad { color: #f87171; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 10px 12px; text-align: right; border-bottom: 1px solid #23272f; }
  th { color: #7d8499; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  td.ep { text-align: left; font-family: ui-monospace, monospace; color: #c0c6d5; }
  tbody tr:hover { background: #1d2027; }
  strong { color: #fafafa; }
</style>
</head>
<body>
  <h1>DiplomaHub — Load test report</h1>
  <p>Artillery 2.x · Сгенерировано ${new Date().toLocaleString('ru-RU')}</p>
  ${blocks}
</body>
</html>`;
}

function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node load-tests/report.js <report1.json> [report2.json ...]');
    process.exit(1);
  }

  const reports = files.map(loadReport);
  const html = buildHtml(reports);
  const out = path.join(__dirname, 'report.html');
  fs.writeFileSync(out, html);
  console.log('✓ HTML report written to', out);
}

main();
