"use client";

import { useState, useEffect, useCallback } from "react";
import { EntryForm } from "@/components/EntryForm";
import { EntryList } from "@/components/EntryList";
import { EmailSendSection } from "@/components/EmailSendSection";
import { AutoSendSettings } from "@/components/AutoSendSettings";

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">タイムエントリー</h1>
            <p className="text-sm text-gray-500 mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/case-codes"
              className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
            >
              マターコード管理
            </a>
            <button
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                window.location.href = "/login";
              }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              ログアウト
            </button>
          </div>
        </div>
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
      {entries.length > 0 && <EmailSendSection date={today} />}

      {/* Auto send settings */}
      <AutoSendSettings />
    </div>
  );
}
