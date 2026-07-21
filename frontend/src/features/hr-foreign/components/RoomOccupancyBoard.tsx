import React, { useState, useEffect } from "react";
import type { RoomOccupancy } from "../types";
import { fetchRoomOccupancy } from "../api";

export const RoomOccupancyBoard: React.FC = () => {
  const [occupancy, setOccupancy] = useState<RoomOccupancy[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchRoomOccupancy();
      setOccupancy(data);
    } catch (err) {
      console.error("Failed to fetch room occupancy:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalResidents = occupancy.reduce((sum, r) => sum + r.active_residents.length, 0);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sơ đồ Hiện trạng Phòng KTX</h2>
          <p className="text-sm text-slate-500">Xem trực quan nhân sự đang lưu trú active tại từng phòng KTX</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-purple-50 text-purple-700 font-semibold text-xs rounded-full border border-purple-200">
            {occupancy.length} phòng KTX
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">
            {totalResidents} người đang ở
          </span>
          <button
            onClick={loadData}
            className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải hiện trạng phòng KTX...</div>
      ) : occupancy.length === 0 ? (
        <div className="py-12 text-center text-slate-400">Chưa có phòng KTX nào trong danh mục.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {occupancy.map((room) => {
            const hasPeople = room.active_residents.length > 0;
            return (
              <div
                key={room.room_id}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  hasPeople
                    ? "bg-white border-blue-200 shadow-xs"
                    : "bg-slate-50/60 border-slate-200 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <h3 className="text-lg font-bold text-slate-800">Phòng {room.room_number}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        hasPeople
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {hasPeople ? `${room.active_residents.length} người` : "Phòng trống"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {hasPeople ? (
                      room.active_residents.map((res) => (
                        <div
                          key={res.stay_id}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200/80 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-900">
                              {res.name_latin}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {res.passport_number}
                            </span>
                          </div>
                          {res.name_chinese && (
                            <div className="text-xs text-slate-600">{res.name_chinese}</div>
                          )}
                          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]">
                              {res.stay_type === "CO_DINH" ? "Cố định" : "Công tác"}
                            </span>
                            {res.has_meals ? (
                              <span className="text-emerald-600 font-semibold text-[11px]">
                                 Có ăn KTX
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Không ăn</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Chưa có người ở</p>
                    )}
                  </div>
                </div>

                {room.notes && (
                  <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-400">
                    {room.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
