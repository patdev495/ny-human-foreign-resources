import React from "react";
import type { TravelRecord } from "../../types";

interface Props {
  travelRecords: TravelRecord[];
  onOpenTravelModal: () => void;
  onEditRecord?: (record: TravelRecord) => void;
  onDeleteRecord?: (recordId: number) => void;
}

export const ProfileTravelTab: React.FC<Props> = ({
  travelRecords,
  onOpenTravelModal,
  onEditRecord,
  onDeleteRecord,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center pb-2">
        <h4 className="text-xs font-bold text-slate-700">
          Lịch sử Nhập xuất cảnh ({travelRecords?.length || 0} đợt)
        </h4>
        <button
          onClick={onOpenTravelModal}
          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          + Thêm / Cập nhật đợt
        </button>
      </div>
      {!travelRecords || travelRecords.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-4 text-center">
          Chưa ghi nhận lịch sử đợt nhập xuất cảnh nào.
        </p>
      ) : (
        travelRecords.map((tr, index) => {
          const isOpenTrip = !tr.actual_exit_date;
          const entryStr = tr.entry_date ? String(tr.entry_date).trim() : "";
          const hasEntryDate = entryStr.length > 0 && entryStr !== "null" && entryStr !== "None";
          const isMissingEntryDate = !hasEntryDate && (Boolean(tr.actual_exit_date) || Boolean(tr.expected_exit_date));

          return (
            <div
              key={tr.id || index}
              className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                isMissingEntryDate
                  ? "border-amber-300 bg-amber-50/40 hover:border-amber-400"
                  : "border-slate-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">
                    Đợt #{travelRecords.length - index}
                  </span>
                  {isOpenTrip ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      Đang ở Việt Nam
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium text-[10px]">
                      Đã về nước
                    </span>
                  )}
                  {isMissingEntryDate && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[10px] flex items-center gap-1">
                      ⚠️ Thiếu ngày đến VN
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 font-mono text-[11px] pt-1">
                  <div>
                    📅 Đến:{" "}
                    {hasEntryDate ? (
                      <span className="font-bold">{entryStr}</span>
                    ) : (
                      <span className="font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300">
                        ⚠️ Chưa nhập ngày sang
                      </span>
                    )}
                  </div>

                  <div>
                    ⏳ Dự kiến về:{" "}
                    <span className="font-medium text-amber-700">
                      {tr.expected_exit_date || "-"}
                    </span>
                  </div>
                  <div>
                    ✈️ Thực tế về:{" "}
                    <span className="font-bold text-rose-700">
                      {tr.actual_exit_date || "Chưa về nước"}
                    </span>
                  </div>
                </div>
                {tr.notes && <div className="text-slate-400 italic text-[11px] pt-0.5">{tr.notes}</div>}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                {onEditRecord && (
                  <button
                    type="button"
                    onClick={() => onEditRecord(tr)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    ✏️ Sửa đợt
                  </button>
                )}
                {onDeleteRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Bạn có chắc chắn muốn xóa Đợt nhập xuất cảnh này?\nTất cả lịch sử lưu trú (ở KTX / Khách sạn) tương ứng với đợt này sẽ bị xóa theo."
                        )
                      ) {
                        onDeleteRecord(tr.id);
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    🗑️ Xóa đợt
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

