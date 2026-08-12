import React from "react";
import type { Stay } from "../../types";

interface Props {
  stays: Stay[];
  onDeleteStay?: (stayId: number) => void;
}

export const ProfileStaysTab: React.FC<Props> = ({ stays, onDeleteStay }) => {
  return (
    <div className="space-y-3">
      {stays.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có lịch sử đợt lưu trú nào.</p>
      ) : (
        stays.map((stay) => {
          const isActive = !stay.end_date || stay.end_date > new Date().toISOString().split("T")[0];
          return (
            <div
              key={stay.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">Stay #{stay.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      stay.accommodation_type === "KTX"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {stay.accommodation_type === "KTX"
                      ? `Phòng KTX ${stay.room_number || "Chưa xếp"}`
                      : "Khách sạn"}
                  </span>
                  {stay.bed_location && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[10px] font-semibold border border-blue-200">
                      Vị trí giường: {stay.bed_location}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                    {stay.stay_type === "CO_DINH" ? "Cố định" : "Công tác"}
                  </span>
                </div>
                <div className="text-slate-600 mt-1.5 font-mono">
                  Thời gian: {stay.start_date} &rarr; {stay.end_date || "Hiện tại"}
                </div>
                {stay.notes && <div className="text-slate-400 mt-0.5 italic">{stay.notes}</div>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isActive ? "Đang lưu trú" : "Đã kết thúc"}
                </span>
                {onDeleteStay && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Bạn có chắc chắn muốn xóa Đợt lưu trú này?\nĐợt nhập xuất cảnh tương ứng sẽ KHÔNG bị ảnh hưởng."
                        )
                      ) {
                        onDeleteStay(stay.id);
                      }
                    }}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    🗑️ Xóa
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
