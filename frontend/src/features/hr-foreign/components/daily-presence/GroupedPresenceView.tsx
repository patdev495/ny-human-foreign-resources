import React from "react";
import type { DailyPresenceGroup, DailyPresenceItem } from "../../types";

interface Props {
  activeSubTab: "ALL" | "KTX" | "HOTEL" | "UNASSIGNED";
  ktxGroups: DailyPresenceGroup[];
  hotelGroups: DailyPresenceGroup[];
  unassignedItems: DailyPresenceItem[];
  onOpenProfile: (empId: number) => void;
}

export const GroupedPresenceView: React.FC<Props> = ({
  activeSubTab,
  ktxGroups,
  hotelGroups,
  unassignedItems,
  onOpenProfile,
}) => {
  return (
    <div className="space-y-8">
      {/* KTX Groups */}
      {(activeSubTab === "ALL" || activeSubTab === "KTX") && (
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span>🏢 Danh sách Theo Phòng KTX</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {ktxGroups.length} Phòng
            </span>
          </h3>

          {ktxGroups.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Không tìm thấy phòng KTX phù hợp</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ktxGroups.map((g) => (
                <div
                  key={`ktx-${g.group_name}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                    <span className="font-bold text-sm">Phòng {g.group_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      {g.count} người
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {g.items.map((item) => (
                      <div key={item.employee_id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => onOpenProfile(item.employee_id)}
                            className="font-bold text-xs text-slate-900 hover:text-blue-600 transition-colors text-left"
                          >
                            {item.name_latin}
                          </button>
                          <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.employee_code || `#${item.employee_id}`}
                          </span>
                        </div>
                        {item.name_chinese && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.name_chinese}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                          {item.department && <span>{item.department}</span>}
                          {item.stay_type && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {item.stay_type === "CONG_TAC" ? "Công tác" : "Cố định"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hotel Groups */}
      {(activeSubTab === "ALL" || activeSubTab === "HOTEL") && (
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span>🏨 Danh sách Theo Khách sạn / Cơ sở lưu trú</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              {hotelGroups.length} Cơ sở
            </span>
          </h3>

          {hotelGroups.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Không tìm thấy cơ sở lưu trú phù hợp</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotelGroups.map((g) => (
                <div
                  key={`hotel-${g.group_name}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="bg-amber-900 text-white px-4 py-2.5 flex items-center justify-between">
                    <span className="font-bold text-sm truncate">{g.group_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      {g.count} người
                    </span>
                  </div>
                  <div className="p-3 divide-y divide-slate-100">
                    {g.items.map((item) => (
                      <div key={item.employee_id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => onOpenProfile(item.employee_id)}
                            className="font-bold text-xs text-slate-900 hover:text-amber-600 transition-colors text-left"
                          >
                            {item.name_latin}
                          </button>
                          {item.hotel_room_number && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              P.{item.hotel_room_number}
                            </span>
                          )}
                        </div>
                        {item.name_chinese && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.name_chinese}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                          {item.department && <span>{item.department}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unassigned Items */}
      {(activeSubTab === "ALL" || activeSubTab === "UNASSIGNED") && unassignedItems.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span>⚠️ Chưa xếp chỗ ở / Đang cập nhật</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
              {unassignedItems.length} người
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassignedItems.map((item) => (
              <div
                key={item.employee_id}
                className="bg-white rounded-2xl border border-rose-200 p-4 shadow-xs hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onOpenProfile(item.employee_id)}
                    className="font-bold text-sm text-slate-900 hover:text-rose-600 transition-colors"
                  >
                    {item.name_latin}
                  </button>
                  <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Chưa xếp phòng
                  </span>
                </div>
                {item.name_chinese && (
                  <p className="text-xs text-slate-500 mt-1">{item.name_chinese}</p>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  <p>Bộ phận: {item.department || "—"}</p>
                  <p>SĐT: {item.phone || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
