"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CaseCode {
  id: number;
  code: string;
  clientCode: string;
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
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!confirm(`マターコード「${codeStr}」を削除しますか？`)) return;
    try {
      const res = await fetch(`/api/case-codes?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchCaseCodes();
    } catch {
      // Network error
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/case-codes/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setImportResult({ ok: true, text: data.message });
        fetchCaseCodes();
      } else {
        setImportResult({
          ok: false,
          text: data.error || "インポートに失敗しました。",
        });
      }
    } catch {
      setImportResult({ ok: false, text: "インポートに失敗しました。" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          <h1 className="text-xl font-bold">マターコード管理</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* CSV Import */}
      <section className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">CSV一括インポート</h2>
        <p className="text-xs text-gray-500 mb-3">
          CSVファイル（クライアントコード, クライアント名, マターコード,
          マター名）を選択してインポートできます。既存のマターコードは上書きされます。
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleCsvImport}
          disabled={importing}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
        />
        {importing && (
          <p className="text-sm text-gray-500 mt-2">インポート中...</p>
        )}
        {importResult && (
          <p
            className={`mt-2 text-sm rounded-lg px-3 py-2 ${importResult.ok ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
          >
            {importResult.text}
          </p>
        )}
      </section>

      {/* Add form */}
      <section className="mb-8 bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">個別登録</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              マターコード
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="例: A0365AR011"
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
              placeholder="例: 味の素㈱"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              マター名
            </label>
            <input
              type="text"
              value={matterName}
              onChange={(e) => setMatterName(e.target.value)}
              placeholder="例: Series A Preferred Stock Financing"
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
            マターコードがまだ登録されていません。
          </p>
        ) : (
          <div className="space-y-2">
            {caseCodes.map((cc) => (
              <div
                key={cc.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-blue-700 text-sm">
                      {cc.code}
                    </p>
                    {cc.clientCode && (
                      <span className="font-mono text-gray-400 text-xs">
                        ({cc.clientCode})
                      </span>
                    )}
                  </div>
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
