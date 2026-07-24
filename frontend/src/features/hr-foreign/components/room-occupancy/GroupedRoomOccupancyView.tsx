import React from "react";
import type { ResidentInfo, RoomOccupancy } from "../../types";

interface Props {
  filteredOccupancy: RoomOccupancy[];
  onCheckOut: (res: ResidentInfo, unitName: string) => void;
}

export const GroupedRoomOccupancyView: React.FC<Props> = ({
  filteredOccupancy,
  onCheckOut,
}) => {
  if (filteredOccupancy.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
        Không có dữ liệu phòng/khách sạn phù hợp.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredOccupancy.map((room) => {
        const isHotel = room.accommodation_type === "HOTEL";
        const unitTitle = isHotel ? room.unit_name : `Phòng ${room.unit_name}`;
        const hasResidents = room.active_residents.length > 0;

        return (
          <div
            key={`${room.accommodation_type}-${room.unit_id}`}
            className={`rounded-2xl border transition-all overflow-hidden flex flex-col ${
              hasResidents
                ? "bg-white border-slate-200 shadow-xs hover:shadow-md"
                : "bg-slate-50/70 border-slate-200/80 opacity-75"
            }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isHotel
                  ? "bg-amber-500/10 border-amber-200 text-amber-900"
                  : "bg-indigo-500/10 border-indigo-200 text-indigo-900"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">{isHotel ? "🏨" : "🏢"}</span>
                  <h3 className="font-bold text-base tracking-tight">{unitTitle}</h3>
                </div>
                {isHotel && room.address && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                    📍 {room.address}
                  </p>
                )}
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  hasResidents
                    ? isHotel
                      ? "bg-amber-100 text-amber-800"
                      : "bg-indigo-100 text-indigo-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {room.active_residents.length} người
              </span>
            </div>

            <div className="p-4 flex-1 divide-y divide-slate-100 space-y-3">
              {!hasResidents ? (
                <div className="py-6 text-center text-xs text-slate-400 italic">Phòng đang trống</div>
              ) : (
                room.active_residents.map((res) => (
                  <div key={res.stay_id} className="pt-3 first:pt-0 flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {res.name_latin}
                        </span>
                        {res.stay_type === "CONG_TAC" && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                            Công tác
                          </span>
                        )}
                      </div>
                      {res.name_chinese && (
                        <p className="text-[11px] text-slate-500 truncate">{res.name_chinese}</p>
                      )}
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap pt-0.5">
                        {res.bed_location && (
                          <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            🛏️ {res.bed_location}
                          </span>
                        )}
                        <span>Vào: {res.start_date || "N/A"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onCheckOut(res, unitTitle)}
                      title="Trả phòng / Chuyển đi"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
