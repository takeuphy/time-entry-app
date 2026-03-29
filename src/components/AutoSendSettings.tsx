"use client";

import { useState, useEffect } from "react";

const SETTING_KEY = "auto_send_email";

export function AutoSendSettings() {
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/settings?key=${SETTING_KEY}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.value) {
          setSavedEmail(data.value);
          setEmail(data.value);
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
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: SETTING_KEY, value: email }),
      });
      if (res.ok) {
        setSavedEmail(email);
        setMessage({ ok: true, text: "自動送信を設定しました。" });
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
      await fetch(`/api/settings?key=${SETTING_KEY}`, { method: "DELETE" });
      setSavedEmail(null);
      setEmail("");
      setMessage({ ok: true, text: "自動送信を無効にしました。" });
    } catch {
      setMessage({ ok: false, text: "設定の削除に失敗しました。" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

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
            <div className="mb-3 bg-green-50 rounded-lg px-3 py-2">
              <p className="text-sm text-green-800">
                送信先: <strong>{savedEmail}</strong>
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

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !email}
              className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving
                ? "保存中..."
                : savedEmail
                  ? "送信先を変更"
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
