import React from "react";
import type { UnclosedMealLockItem } from "../../types";

interface UnclosedMealLocksModalProps {
  isOpen: boolean;
  missingLocks: UnclosedMealLockItem[] | null;
  onClose: () => void;
}

export const UnclosedMealLocksModal: React.FC<UnclosedMealLocksModalProps> = ({
  isOpen,
  missingLocks,
  onClose,
}) => {
  if (!isOpen || !missingLocks || missingLocks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-base font-bold text-slate-800">Cảnh báo: Chưa Chốt Suất ăn</h3>
            <p className="text-xs text-slate-500">
              Vui lòng hoàn tất Chốt suất ăn cho các ngày/bữa sau trước khi xuất Báo cáo Excel.
            </p>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1">
          {missingLocks.map((item, idx) => {
            const formatSession = (session: string): string => {
              switch (session) {
                case "BREAKFAST":
                  return "Bữa Sáng (NNN)";
                case "DINNER":
                  return "Bữa Tối (NNN)";
                case "LUNCH":
                  return "Bữa Trưa (Tạp vụ)";
                case "FRUIT":
                  return "Xác nhận Tiền Hoa quả";
                default:
                  return session;
              }
            };

            const formattedSessions =
              item.missing_sessions && item.missing_sessions.length > 0
                ? item.missing_sessions.map(formatSession).join(", ")
                : "Chưa chốt suất ăn";

            return (
              <div
                key={idx}
                className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 font-mono">{item.date}</span>
                  <span className="text-slate-400 mx-2">|</span>
                  <span className="font-medium text-amber-900">{formattedSessions}</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold text-[10px]">
                  Chưa chốt ({item.missing_sessions?.length ?? 0} bữa)
                </span>
              </div>
            );
          })}
        </div>


        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors cursor-pointer"
          >
            Đã hiểu, quay lại Chốt suất ăn
          </button>
        </div>
      </div>
    </div>
  );
};
