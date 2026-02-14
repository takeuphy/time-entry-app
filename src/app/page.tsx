"use client";

import { useState, useEffect, useCallback } from "react";
import { EntryForm } from "@/components/EntryForm";
import { EntryList } from "@/components/EntryList";

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface TimeEntry {
  id: number;
  clientName: string;
  matterName: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

export default function Home() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const today = todayString();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/entries?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      // Network error — silently ignore
    }
  }, [today]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: number) => {
    if (!confirm("このエントリーを削除しますか？")) return;
    try {
      const res = await fetch(`/api/entries?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEntries();
      }
    } catch {
      // Network error
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">タイムエントリー</h1>
        <p className="text-sm text-gray-500 mt-1">{today}</p>
      </header>

      {/* Entry form */}
      <section className="mb-8">
        <EntryForm onEntryAdded={fetchEntries} />
      </section>

      {/* Today's entries */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">本日のエントリー</h2>
          <a
            href="/entries"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            すべて表示 →
          </a>
        </div>
        <EntryList entries={entries} onDelete={handleDelete} />
      </section>

      {/* Email send */}
      {entries.length > 0 && (
        <section className="mt-8 bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">メールで送信</h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="送信先メールアドレス"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={async () => {
                if (!email) return;
                setSending(true);
                setSendResult(null);
                try {
                  const res = await fetch(
                    `/api/send-daily-report?date=${today}&email=${encodeURIComponent(email)}`,
                    { method: "POST" }
                  );
                  const data = await res.json();
                  if (res.ok) {
                    setSendResult({ ok: true, message: data.message });
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
              className="bg-green-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {sending ? "送信中..." : "送信"}
            </button>
          </div>
          {sendResult && (
            <p className={`mt-2 text-sm rounded-lg px-3 py-2 ${sendResult.ok ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
              {sendResult.message}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
