import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  employeeName: string;
  employeeCode?: string | null;
  passportNumber?: string | null;
  department?: string | null;
  warningMessage?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận Xóa Hồ sơ Nhân sự",
  employeeName,
  employeeCode,
  passportNumber,
  department,
  warningMessage = "Thao tác này sẽ xóa vĩnh viễn Hồ sơ Nhân sự cùng toàn bộ dữ liệu liên quan (Lịch sử lưu trú, Visa, Tạm trú, Giấy phép lao động và Nhật ký Nhập xuất cảnh). Hành động này KHÔNG THỂ khôi phục.",
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, deleting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Xóa hồ sơ không thành công");
    } finally {
      setDeleting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Danger Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-base font-bold tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Employee target summary */}
          <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">Đối tượng xóa:</p>
            <p className="text-sm font-extrabold text-slate-900">{employeeName}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 font-mono text-[11px] pt-1 border-t border-rose-200/50">
              {employeeCode && <span>Mã NV: <strong>{employeeCode}</strong></span>}
              {passportNumber && <span>Hộ chiếu: <strong>{passportNumber}</strong></span>}
              {department && <span>Bộ phận: <strong>{department}</strong></span>}
            </div>
          </div>

          {/* Detailed Warning Notice */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
            <p className="font-semibold text-xs mb-1 text-amber-950 flex items-center gap-1">
              <span>🚨 Cảnh báo dữ liệu:</span>
            </p>
            <p className="text-[11px] text-amber-800">{warningMessage}</p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              {deleting ? (
                <>
                  <span className="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <span>🗑️ Xóa vĩnh viễn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
