"use client";

import { useState } from "react";
import { VoiceInput } from "./VoiceInput";

interface EntryFormProps {
  onEntryAdded: () => void;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentTimeRounded(): string {
  const d = new Date();
  const m = Math.floor(d.getMinutes() / 6) * 6;
  return `${String(d.getHours()).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parse Japanese spoken time expressions into HH:MM format.
 *   "14時30分" → "14:30"    "午後2時半" → "14:30"
 *   "午前9時"  → "09:00"    "9時"      → "09:00"
 */
function parseJapaneseTime(input: string): string | null {
  let text = input
    .replace(/[０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .replace(/\s+/g, "");

  let isPM = false;
  let isAM = false;
  if (text.includes("午後")) {
    isPM = true;
    text = text.replace(/午後/g, "");
  }
  if (text.includes("午前")) {
    isAM = true;
    text = text.replace(/午前/g, "");
  }

  let hours = -1;
  let minutes = 0;
  let match;

  // "X時Y分"
  if ((match = text.match(/(\d{1,2})時(\d{1,2})分/))) {
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
  }
  // "X時半"
  if (hours === -1 && (match = text.match(/(\d{1,2})時半/))) {
    hours = parseInt(match[1]);
    minutes = 30;
  }
  // "X時"
  if (hours === -1 && (match = text.match(/(\d{1,2})時/))) {
    hours = parseInt(match[1]);
  }
  // "HH:MM"
  if (hours === -1 && (match = text.match(/(\d{1,2}):(\d{2})/))) {
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
  }

  if (hours === -1) return null;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function EntryForm({ onEntryAdded }: EntryFormProps) {
  const [clientName, setClientName] = useState("");
  const [matterName, setMatterName] = useState("");
  const [date, setDate] = useState(todayString);
  const [startTime, setStartTime] = useState(currentTimeRounded);
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleTimeVoice = (setter: (v: string) => void) => (text: string) => {
    const parsed = parseJapaneseTime(text);
    if (parsed) setter(parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!clientName || !matterName || !date || !startTime || !endTime || !description) {
      setError("すべての項目を入力してください。");
      return;
    }

    if (startTime >= endTime) {
      setError("終了時刻は開始時刻より後にしてください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          matterName,
          date,
          startTime,
          endTime,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "登録に失敗しました。");
      }

      setClientName("");
      setMatterName("");
      setStartTime(currentTimeRounded());
      setEndTime("");
      setDescription("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onEntryAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          クライアント名
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="例: ABC株式会社"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <VoiceInput onResult={setClientName} />
        </div>
      </div>

      {/* Matter name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          案件名
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={matterName}
            onChange={(e) => setMatterName(e.target.value)}
            placeholder="例: M&A案件"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <VoiceInput onResult={setMatterName} />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          日付
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Start time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          開始時刻
        </label>
        <div className="flex gap-2">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            step="360"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <VoiceInput onResult={handleTimeVoice(setStartTime)} />
        </div>
        <p className="text-xs text-gray-400 mt-1">例:「14時30分」「午後2時半」</p>
      </div>

      {/* End time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          終了時刻
        </label>
        <div className="flex gap-2">
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            step="360"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <VoiceInput onResult={handleTimeVoice(setEndTime)} />
        </div>
        <p className="text-xs text-gray-400 mt-1">例:「16時」「午後4時15分」</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          作業内容
        </label>
        <div className="flex gap-2 items-start">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例: 契約書のレビュー、修正コメントの作成"
            rows={3}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <VoiceInput onResult={setDescription} />
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">
          登録しました。
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg text-base hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "登録中..." : "エントリーを登録"}
      </button>
    </form>
  );
}
