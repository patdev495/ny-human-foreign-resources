import React, { useState, useEffect } from "react";

interface PdfViewerModalProps {
  isOpen: boolean;
  title: string;
  docKey: string | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  title,
  docKey,
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !docKey) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    let active = true;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(null);
    setBlobUrl(null);

    const pdfApiUrl = `/api/vehicle-management/contracts/pdf/${docKey}`;

    fetch(pdfApiUrl)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.detail || `Không thể tải file PDF (${res.status})`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || "Lỗi tải file hợp đồng");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, docKey]);

  if (!isOpen || !docKey) return null;

  const pdfUrl = `/api/vehicle-management/contracts/pdf/${docKey}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/15 text-white rounded-lg text-lg">📄</span>
            <div>
              <h3 className="font-bold text-base text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">File Hợp Đồng Gốc (Định dạng PDF)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              ↗ Mở Trong Tab Mới
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-lg font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 bg-slate-100 relative flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Đang tải file PDF hợp đồng...</span>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 max-w-md text-center shadow-sm">
              <div className="text-3xl mb-2">⚠️</div>
              <h4 className="font-bold text-base mb-1 text-slate-800">Không thể xem file hợp đồng</h4>
              <p className="text-xs text-red-600 mb-4">{error}</p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors inline-block"
              >
                Mở link trực tiếp
              </a>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <object
              data={blobUrl}
              type="application/pdf"
              className="w-full h-full border-none"
            >
              <iframe
                src={blobUrl}
                title={title}
                className="w-full h-full border-none"
              />
            </object>
          )}
        </div>
      </div>
    </div>
  );
};

