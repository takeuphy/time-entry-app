"use client";

import { useState, useEffect, useCallback } from "react";

interface CaseCode {
  id: number;
  code: string;
  clientName: string;
  matterName: string;
}

export default function CaseCodesPage() {
  const [caseCodes, setCaseCodes] = useState<CaseCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [matterName, setMatterName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCaseCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/case-codes");
      if (res.ok) setCaseCodes(await res.json());
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaseCodes();
  }, [fetchCaseCodes]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!code || !clientName || !matterName) {
      setError("すべての項目を入力してください。");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/case-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, clientName, matterName }),
      });
      if (res.ok) {
        setCode("");
        setClientName("");
        setMatterName("");
        setSuccess("登録しました。");
        setTimeout(() => setSuccess(""), 2000);
        fetchCaseCodes();
      } else {
        const data = await res.json();
        setError(data.error || "登録に失敗しました。");
      }
    } catch {
      setError("登録に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, codeStr: string) => {
    if (!confirm(`ケースコード「${codeStr}」を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/case-codes?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchCaseCodes();
    } catch {
      // Network error
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← 入力画面
          </a>
          <h1 className="text-xl font-bold">ケースコード管理</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Add form */}
      <section className="mb-8 bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">新規登録</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ケースコード
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="例: A-2024-001"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              クライアント名
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="例: ABC株式会社"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              案件名
            </label>
            <input
              type="text"
              value={matterName}
              onChange={(e) => setMatterName(e.target.value)}
              placeholder="例: M&A案件"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg text-base hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "登録中..." : "登録"}
          </button>
        </form>
      </section>

      {/* List */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          登録済み（{caseCodes.length}件）
        </h2>
        {loading ? (
          <p className="text-gray-500 text-center py-8">読み込み中...</p>
        ) : caseCodes.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            ケースコードがまだ登録されていません。
          </p>
        ) : (
          <div className="space-y-2">
            {caseCodes.map((cc) => (
              <div
                key={cc.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between"
              >
                <div>
                  <p className="font-mono font-bold text-blue-700 text-sm">
                    {cc.code}
                  </p>
                  <p className="text-sm text-gray-800">{cc.clientName}</p>
                  <p className="text-sm text-gray-500">{cc.matterName}</p>
                </div>
                <button
                  onClick={() => handleDelete(cc.id, cc.code)}
                  className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
