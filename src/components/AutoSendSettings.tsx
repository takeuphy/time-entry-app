"use client";

import { useState, useEffect } from "react";

const EMAIL_KEY = "auto_send_email";
const TZ_KEY = "auto_send_timezone";

const TIMEZONE_OPTIONS = [
  { value: "America/Los_Angeles", label: "カリフォルニア時間（太平洋時間）" },
  { value: "Asia/Tokyo", label: "日本時間（JST）" },
];

export function AutoSendSettings() {
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [savedTimezone, setSavedTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
    Promise.all([
      fetch(`/api/settings?key=${EMAIL_KEY}`).then((r) => r.json()),
      fetch(`/api/settings?key=${TZ_KEY}`).then((r) => r.json()),
    ])
      .then(([emailData, tzData]) => {
        if (emailData.value) {
          setSavedEmail(emailData.value);
          setEmail(emailData.value);
        }
        if (tzData.value) {
          setSavedTimezone(tzData.value);
          setTimezone(tzData.value);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!email) return;
    setSaving(true);
    setMessage(null);
    try {
      const [emailRes, tzRes] = await Promise.all([
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: EMAIL_KEY, value: email }),
        }),
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: TZ_KEY, value: timezone }),
        }),
      ]);
      if (emailRes.ok && tzRes.ok) {
        setSavedEmail(email);
        setSavedTimezone(timezone);
        const tzLabel =
          TIMEZONE_OPTIONS.find((o) => o.value === timezone)?.label ?? timezone;
        setMessage({
          ok: true,
          text: `保存しました。（毎朝6時 ${tzLabel}）`,
        });
      } else {
        setMessage({ ok: false, text: "保存に失敗しました。" });
      }
    } catch {
      setMessage({ ok: false, text: "保存に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm("自動送信を無効にしますか？")) return;
    setSaving(true);
    setMessage(null);
    try {
      await Promise.all([
        fetch(`/api/settings?key=${EMAIL_KEY}`, { method: "DELETE" }),
        fetch(`/api/settings?key=${TZ_KEY}`, { method: "DELETE" }),
      ]);
      setSavedEmail(null);
      setSavedTimezone(null);
      setEmail("");
      setMessage({ ok: true, text: "自動送信を無効にしました。" });
    } catch {
      setMessage({ ok: false, text: "設定の削除に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/auto-send?force=true", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTestResult({
          ok: true,
          text: data.message || "テスト送信が成功しました。",
        });
      } else {
        setTestResult({
          ok: false,
          text: data.error || "テスト送信に失敗しました。",
        });
      }
    } catch {
      setTestResult({ ok: false, text: "テスト送信に失敗しました。" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return null;

  const currentTzLabel =
    TIMEZONE_OPTIONS.find((o) => o.value === (savedTimezone || timezone))
      ?.label ?? "";
  const cronTimezoneName =
    savedTimezone === "Asia/Tokyo"
      ? "Asia/Tokyo"
      : "America/Los_Angeles";
  const autoSendUrl = appUrl ? `${appUrl}/api/auto-send` : "";

  return (
    <section className="mt-8 bg-white border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">自動送信設定</span>
          {savedEmail && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              ON
            </span>
          )}
        </div>
        <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 mb-3">
            毎朝6時に、過去24時間に入力されたエントリーを自動でメール送信します。
          </p>

          {savedEmail && (
            <div className="mb-3 bg-green-50 rounded-lg px-3 py-2 space-y-1">
              <p className="text-sm text-green-800">
                送信先: <strong>{savedEmail}</strong>
              </p>
              <p className="text-sm text-green-800">
                送信時刻: 毎朝6時（{currentTzLabel}）
              </p>
            </div>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="送信先メールアドレス"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            タイムゾーン
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mb-3"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !email}
              className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving
                ? "保存中..."
                : savedEmail
                  ? "設定を変更"
                  : "自動送信を有効にする"}
            </button>
            {savedEmail && (
              <button
                onClick={handleDisable}
                disabled={saving}
                className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg text-sm hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                無効
              </button>
            )}
          </div>

          {message && (
            <p
              className={`mt-2 text-sm rounded-lg px-3 py-2 ${message.ok ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {message.text}
            </p>
          )}

          {/* Test send section */}
          {savedEmail && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold mb-2">動作確認</h3>
              <p className="text-xs text-gray-500 mb-2">
                下のボタンで、すぐにテスト送信できます。メールが届けば自動送信の設定は正しく動作しています。
              </p>
              <button
                onClick={handleTest}
                disabled={testing}
                className="w-full bg-purple-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {testing ? "送信中..." : "今すぐテスト送信"}
              </button>
              {testResult && (
                <p
                  className={`mt-2 text-sm rounded-lg px-3 py-2 ${testResult.ok ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
                >
                  {testResult.text}
                </p>
              )}
            </div>
          )}

          {/* Cron setup instructions */}
          {savedEmail && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold mb-2">
                毎朝6時の自動送信を有効にする
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                テスト送信が成功したら、無料サービス <strong>cron-job.org</strong>{" "}
                で以下の通り設定してください。
              </p>
              <ol className="text-xs text-gray-700 space-y-1 list-decimal pl-4 mb-2">
                <li>
                  <a
                    href="https://cron-job.org"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    cron-job.org
                  </a>{" "}
                  でアカウント作成（無料）
                </li>
                <li>「CREATE CRONJOB」をクリック</li>
                <li>以下を入力して保存：</li>
              </ol>
              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2 font-mono">
                <div>
                  <div className="text-gray-500 font-sans">URL:</div>
                  <div className="break-all select-all">{autoSendUrl}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-sans">Schedule:</div>
                  <div>Every day at 06:00</div>
                </div>
                <div>
                  <div className="text-gray-500 font-sans">Timezone:</div>
                  <div>{cronTimezoneName}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-sans">Request method:</div>
                  <div>POST</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
