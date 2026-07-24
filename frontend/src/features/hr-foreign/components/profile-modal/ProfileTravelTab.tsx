import React from "react";
import type { TravelRecord } from "../../types";

interface Props {
  travelRecords: TravelRecord[];
  onOpenTravelModal: () => void;
}

export const ProfileTravelTab: React.FC<Props> = ({
  travelRecords,
  onOpenTravelModal,
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
          return (
            <div
              key={tr.id || index}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 font-mono text-[11px] pt-1">
                  <div>
                    📅 Đến: <span className="font-bold">{tr.entry_date || "-"}</span>
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
            </div>
          );
        })
      )}
    </div>
  );
};
