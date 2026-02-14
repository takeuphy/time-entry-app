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

function normalizeJapaneseNumbers(input: string): string {
  return input
    .replace(/[０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .replace(/\s+/g, "");
}

/**
 * Parse Japanese spoken time expressions into HH:MM format.
 *   "14時30分" → "14:30"    "午後2時半" → "14:30"
 *   "午前9時"  → "09:00"    "9時"      → "09:00"
 */
function parseJapaneseTime(input: string): string | null {
  let text = normalizeJapaneseNumbers(input);

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

/**
 * Parse Japanese duration expression into minutes.
 *   "45分" → 45    "1時間" → 60    "1時間30分" → 90    "1時間半" → 90
 */
function parseJapaneseDuration(input: string): number | null {
  const text = normalizeJapaneseNumbers(input);
  let match;

  // "X時間Y分"
  if ((match = text.match(/(\d{1,2})時間(\d{1,2})分/))) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  // "X時間半"
  if ((match = text.match(/(\d{1,2})時間半/))) {
    return parseInt(match[1]) * 60 + 30;
  }
  // "X時間"
  if ((match = text.match(/(\d{1,2})時間/))) {
    return parseInt(match[1]) * 60;
  }
  // "Y分" (minutes only)
  if ((match = text.match(/(\d{1,3})分/)) && !text.includes("時")) {
    return parseInt(match[1]);
  }

  return null;
}

interface TimeRange {
  start: string;
  end: string;
}

/**
 * Parse Japanese time range expressions.
 *   "14時30分から15時30分"  → { start: "14:30", end: "15:30" }
 *   "15時から45分"          → { start: "15:00", end: "15:45" }
 *   "午後2時から1時間30分"  → { start: "14:00", end: "15:30" }
 *   "9時から1時間"          → { start: "09:00", end: "10:00" }
 */
function parseJapaneseTimeRange(input: string): TimeRange | null {
  const text = normalizeJapaneseNumbers(input);

  const karaIndex = text.indexOf("から");
  if (karaIndex === -1) return null;

  const startPart = text.substring(0, karaIndex);
  const endPart = text.substring(karaIndex + 2);

  const start = parseJapaneseTime(startPart);
  if (!start) return null;

  // Try parsing the end part as a time
  const endAsTime = parseJapaneseTime(endPart);
  if (endAsTime) {
    return { start, end: endAsTime };
  }

  // Try parsing the end part as a duration
  const durationMinutes = parseJapaneseDuration(endPart);
  if (durationMinutes !== null) {
    const [sh, sm] = start.split(":").map(Number);
    const totalMinutes = sh * 60 + sm + durationMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return {
      start,
      end: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
    };
  }

  return null;
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

  const handleTimeRangeVoice = (text: string) => {
    // Try range first: "14時30分から15時30分" or "15時から45分"
    const range = parseJapaneseTimeRange(text);
    if (range) {
      setStartTime(range.start);
      setEndTime(range.end);
      return;
    }
    // Fallback: single time → set as start time
    const single = parseJapaneseTime(text);
    if (single) {
      setStartTime(single);
    }
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

      {/* Time range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          時間
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            step="360"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">〜</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            step="360"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <VoiceInput onResult={handleTimeRangeVoice} />
        </div>
        <p className="text-xs text-gray-400 mt-1">例:「14時30分から15時30分」「15時から45分」</p>
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
