import nodemailer from "nodemailer";

interface TimeEntry {
  id: number;
  clientName: string;
  matterName: string;
  caseCode?: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

function calcDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

function formatDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

export async function sendDailyReport(
  entries: TimeEntry[],
  reportDate: string,
  toOverride?: string
) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const to = toOverride || process.env.ASSISTANT_EMAIL;

  if (!host || !user || !pass || !from || !to) {
    throw new Error(
      "メール設定が不完全です。環境変数を確認してください。(SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, ASSISTANT_EMAIL)"
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  let totalMinutes = 0;
  const entryRows = entries
    .map((e) => {
      const dur = calcDurationMinutes(e.startTime, e.endTime);
      totalMinutes += dur;
      return `
      <tr>
        <td style="border:1px solid #ddd;padding:8px;font-family:monospace;font-size:12px;">${e.caseCode || ""}</td>
        <td style="border:1px solid #ddd;padding:8px;">${e.clientName}</td>
        <td style="border:1px solid #ddd;padding:8px;">${e.matterName}</td>
        <td style="border:1px solid #ddd;padding:8px;white-space:nowrap;">${e.startTime} - ${e.endTime}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatDecimalHours(dur)}h</td>
        <td style="border:1px solid #ddd;padding:8px;">${e.description}</td>
      </tr>`;
    })
    .join("");

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const html = `
    <div style="font-family:sans-serif;max-width:800px;margin:0 auto;">
      <h2>タイムエントリー日報 — ${reportDate}</h2>
      ${
        entries.length === 0
          ? "<p>この日のエントリーはありません。</p>"
          : `
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="border:1px solid #ddd;padding:8px;text-align:left;">マターコード</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:left;">クライアント</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:left;">案件</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:left;">時間</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right;">時間数</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:left;">作業内容</th>
            </tr>
          </thead>
          <tbody>${entryRows}</tbody>
          <tfoot>
            <tr style="background:#f5f5f5;font-weight:bold;">
              <td colspan="4" style="border:1px solid #ddd;padding:8px;text-align:right;">合計</td>
              <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatDecimalHours(totalMinutes)}h (${formatDuration(totalMinutes)})</td>
              <td style="border:1px solid #ddd;padding:8px;"></td>
            </tr>
          </tfoot>
        </table>
        `
      }
      <p style="margin-top:16px;font-size:13px;color:#666;">
        <a href="${appUrl}/entries?date=${reportDate}">アプリで確認する</a>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `【タイムエントリー日報】${reportDate}`,
    html,
  });
}

export async function sendAutoReport(
  entries: TimeEntry[],
  windowLabel: string,
  to: string
) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error(
      "メール設定が不完全です。環境変数を確認してください。(SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM)"
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  // Group entries by date
  const grouped = new Map<string, TimeEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.date) || [];
    list.push(entry);
    grouped.set(entry.date, list);
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  let totalMinutesAll = 0;

  let dateSections = "";
  for (const [date, dateEntries] of grouped) {
    let dateTotal = 0;
    const rows = dateEntries
      .map((e) => {
        const dur = calcDurationMinutes(e.startTime, e.endTime);
        dateTotal += dur;
        totalMinutesAll += dur;
        return `
        <tr>
          <td style="border:1px solid #ddd;padding:8px;font-family:monospace;font-size:12px;">${e.caseCode || ""}</td>
          <td style="border:1px solid #ddd;padding:8px;">${e.clientName}</td>
          <td style="border:1px solid #ddd;padding:8px;">${e.matterName}</td>
          <td style="border:1px solid #ddd;padding:8px;white-space:nowrap;">${e.startTime} - ${e.endTime}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:right;">${formatDecimalHours(dur)}h</td>
          <td style="border:1px solid #ddd;padding:8px;">${e.description}</td>
        </tr>`;
      })
      .join("");

    dateSections += `
      <h3 style="margin-top:20px;margin-bottom:8px;color:#333;">${date}（小計: ${formatDecimalHours(dateTotal)}h）
        <a href="${appUrl}/entries?date=${date}" style="font-size:13px;font-weight:normal;margin-left:8px;">確認</a>
      </h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">マターコード</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">クライアント</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">案件</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">時間</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:right;">時間数</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">作業内容</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  const today = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const html = `
    <div style="font-family:sans-serif;max-width:800px;margin:0 auto;">
      <h2>タイムエントリー自動レポート</h2>
      <p style="color:#666;font-size:13px;">入力期間: ${windowLabel}　／　合計: ${formatDecimalHours(totalMinutesAll)}h (${formatDuration(totalMinutesAll)}) ／ ${entries.length}件</p>
      ${dateSections}
      <p style="margin-top:20px;font-size:13px;color:#666;">
        <a href="${appUrl}/entries?date=${today}">アプリで確認する</a>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `【タイムエントリー自動レポート】${windowLabel}（${entries.length}件）`,
    html,
  });
}
