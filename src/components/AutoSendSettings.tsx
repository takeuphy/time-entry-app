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
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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
          text: `自動送信を設定しました。（毎朝6時 ${tzLabel}）`,
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

  if (loading) return null;

  const currentTzLabel =
    TIMEZONE_OPTIONS.find((o) => o.value === (savedTimezone || timezone))
      ?.label ?? "";

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

          <p className="text-xs text-gray-400 mt-3">
            ※ 外部cronサービス（cron-job.org等）の設定が別途必要です
          </p>
        </div>
      )}
    </section>
  );
}
