import { useEffect, useState } from "react";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { systemSecondaryButton } from "../../../shared/components/systemStyles";

interface PdfViewerModalProps {
  isOpen: boolean;
  title: string;
  docKey: string | null;
  onClose: () => void;
}

export function PdfViewerModal({ isOpen, title, docKey, onClose }: PdfViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const pdfUrl = docKey ? `/api/vehicle-management/contracts/pdf/${encodeURIComponent(docKey)}` : "";
  useEffect(() => {
    setBlobUrl(null);
    setError(null);
    if (!isOpen || !pdfUrl) return;
    let active = true;
    let createdUrl: string | null = null;
    setLoading(true);
    fetch(pdfUrl).then(async response => {
      if (!response.ok) {
        const detail: unknown = await response.json().catch(() => null);
        const message = typeof detail === "object" && detail !== null && "detail" in detail && typeof detail.detail === "string" ? detail.detail : `Không tải được file PDF (${response.status}).`;
        throw new Error(message);
      }
      return response.blob();
    }).then(blob => { if (active) { createdUrl = URL.createObjectURL(blob); setBlobUrl(createdUrl); } })
      .catch((failure: unknown) => { if (active) setError(failure instanceof Error ? failure.message : "Không tải được file hợp đồng."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; if (createdUrl) URL.revokeObjectURL(createdUrl); };
  }, [isOpen, pdfUrl, retry]);

  return <SystemDialog isOpen={isOpen && docKey !== null} title={title} onClose={onClose} wide>
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-slate-500">Bản hợp đồng gốc · PDF</span><a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={systemSecondaryButton}>Mở trong tab mới</a></div>
      {loading && <p role="status" className="py-6 text-sm text-slate-500">Đang tải file hợp đồng…</p>}
      {!loading && error && <div role="alert" className="space-y-3 rounded-sm border border-red-200 p-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className={systemSecondaryButton}>Thử lại</button></div>}
      {!loading && !error && blobUrl && <object data={blobUrl} type="application/pdf" aria-label={title} className="h-[65dvh] min-h-64 w-full border border-slate-200"><p className="p-4 text-sm text-slate-600">Trình duyệt chưa hỗ trợ xem PDF tại đây. <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">Mở hợp đồng trong tab mới</a>.</p></object>}
    </div>
  </SystemDialog>;
}
