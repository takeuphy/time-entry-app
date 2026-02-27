"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { EntryList } from "@/components/EntryList";
import { EmailSendSection } from "@/components/EmailSendSection";
import { useSearchParams } from "next/navigation";

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

function EntriesContent() {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") || todayString();
  const [date, setDate] = useState(initialDate);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entries?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [date]);

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

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setDate(newDate);
  };

  return (
    <>
      {/* Date selector */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-lg border border-gray-200 p-3">
        <button
          onClick={() => changeDate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg"
        >
          ‹
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-center font-medium text-base border-none focus:outline-none"
        />
        <button
          onClick={() => changeDate(1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg"
        >
          ›
        </button>
      </div>

      {/* Entries */}
      {loading ? (
        <p className="text-gray-500 text-center py-8">読み込み中...</p>
      ) : (
        <>
          <EntryList entries={entries} onDelete={handleDelete} />
          {entries.length > 0 && <EmailSendSection date={date} />}
        </>
      )}
    </>
  );
}

export default function EntriesPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← 入力画面
          </a>
          <h1 className="text-xl font-bold">エントリー確認</h1>
          <div className="w-16" />
        </div>
      </header>

      <Suspense
        fallback={
          <p className="text-gray-500 text-center py-8">読み込み中...</p>
        }
      >
        <EntriesContent />
      </Suspense>
    </div>
  );
}
