"use client";

import { useState, useEffect } from "react";

const SAVED_EMAILS_KEY = "time-entry-saved-emails";

function loadSavedEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(SAVED_EMAILS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEmail(email: string) {
  const list = loadSavedEmails();
  if (!list.includes(email)) {
    list.unshift(email);
    localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify(list));
  }
}

function removeEmail(email: string) {
  const list = loadSavedEmails().filter((e) => e !== email);
  localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify(list));
}

interface EmailSendSectionProps {
  date: string;
}

export function EmailSendSection({ date }: EmailSendSectionProps) {
  const [email, setEmail] = useState("");
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [showNewInput, setShowNewInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const list = loadSavedEmails();
    setSavedEmails(list);
    if (list.length > 0) {
      setEmail(list[0]);
    } else {
      setShowNewInput(true);
    }
  }, []);

  // Clear send result when date changes
  useEffect(() => {
    setSendResult(null);
  }, [date]);

  return (
    <section className="mt-8 bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">メールで送信</h2>

      {/* Saved emails dropdown */}
      {savedEmails.length > 0 && !showNewInput && (
        <div className="space-y-2 mb-3">
          <select
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {savedEmails.map((addr) => (
              <option key={addr} value={addr}>
                {addr}
              </option>
            ))}
          </select>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowNewInput(true);
                setEmail("");
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              + 新しいアドレスを追加
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirm(`「${email}」を削除しますか？`)) return;
                removeEmail(email);
                const updated = loadSavedEmails();
                setSavedEmails(updated);
                if (updated.length > 0) {
                  setEmail(updated[0]);
                } else {
                  setEmail("");
                  setShowNewInput(true);
                }
              }}
              className="text-red-500 hover:text-red-700"
            >
              この宛先を削除
            </button>
          </div>
        </div>
      )}

      {/* New email input */}
      {(showNewInput || savedEmails.length === 0) && (
        <div className="mb-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="送信先メールアドレス"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {savedEmails.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowNewInput(false);
                setEmail(savedEmails[0]);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              登録済みから選ぶ
            </button>
          )}
        </div>
      )}

      {/* Send button */}
      <button
        onClick={async () => {
          if (!email) return;
          setSending(true);
          setSendResult(null);
          try {
            const res = await fetch(
              `/api/send-daily-report?date=${date}&email=${encodeURIComponent(email)}`,
              { method: "POST" }
            );
            const data = await res.json();
            if (res.ok) {
              setSendResult({ ok: true, message: data.message });
              saveEmail(email);
              setSavedEmails(loadSavedEmails());
              setShowNewInput(false);
            } else {
              setSendResult({ ok: false, message: data.error });
            }
          } catch {
            setSendResult({ ok: false, message: "送信に失敗しました。" });
          } finally {
            setSending(false);
          }
        }}
        disabled={sending || !email}
        className="w-full bg-green-600 text-white font-medium py-3 rounded-lg text-base hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors"
      >
        {sending ? "送信中..." : "送信"}
      </button>

      {sendResult && (
        <p
          className={`mt-2 text-sm rounded-lg px-3 py-2 ${sendResult.ok ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
        >
          {sendResult.message}
        </p>
      )}
    </section>
  );
}
