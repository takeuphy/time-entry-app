"use client";

interface TimeEntry {
  id: number;
  clientName: string;
  matterName: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

interface EntryListProps {
  entries: TimeEntry[];
  onDelete?: (id: number) => void;
  showDelete?: boolean;
}

function calcMinutes(start: string, end: string): number {
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

export function EntryList({
  entries,
  onDelete,
  showDelete = true,
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        エントリーはまだありません。
      </p>
    );
  }

  const totalMinutes = entries.reduce(
    (sum, e) => sum + calcMinutes(e.startTime, e.endTime),
    0
  );

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const dur = calcMinutes(entry.startTime, entry.endTime);
        return (
          <div
            key={entry.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {entry.clientName}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {entry.matterName}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {entry.startTime} - {entry.endTime}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDuration(dur)} ({formatDecimalHours(dur)}h)
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-700">{entry.description}</p>
            {showDelete && onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                削除
              </button>
            )}
          </div>
        );
      })}

      {/* Total */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          合計:{" "}
          <span className="font-bold text-gray-900">
            {formatDecimalHours(totalMinutes)}時間 ({formatDuration(totalMinutes)}
            )
          </span>
          <span className="text-gray-400 ml-2">/ {entries.length}件</span>
        </p>
      </div>
    </div>
  );
}
