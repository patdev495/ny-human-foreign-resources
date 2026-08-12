import React from "react";
import type { DailyMealEmployeeItem } from "../../types";

interface Props {
  filteredEmployees: DailyMealEmployeeItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  lodgingFilter: "ALL" | "KTX" | "HOTEL";
  setLodgingFilter: (filter: "ALL" | "KTX" | "HOTEL") => void;
  onToggleAbsence: (emp: DailyMealEmployeeItem, session: "BREAKFAST" | "DINNER") => void;
  onToggleHasMeals: (emp: DailyMealEmployeeItem) => void;
}

export const MealEmployeeForecastTable: React.FC<Props> = ({
  filteredEmployees,
  searchTerm,
  setSearchTerm,
  lodgingFilter,
  setLodgingFilter,
  onToggleAbsence,
  onToggleHasMeals,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Filter Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700">Lọc chỗ ở:</span>
          <div className="flex bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setLodgingFilter("ALL")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                lodgingFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setLodgingFilter("KTX")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                lodgingFilter === "KTX"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏢 KTX
            </button>
            <button
              onClick={() => setLodgingFilter("HOTEL")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                lodgingFilter === "HOTEL"
                  ? "bg-white text-amber-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏨 Khách sạn
            </button>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm theo tên, mã NV, vị trí phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">STT</th>
              <th className="py-3.5 px-4">Mã NV</th>
              <th className="py-3.5 px-4">Họ và tên</th>
              <th className="py-3.5 px-4">Chỗ ở hiện tại</th>
              <th className="py-3.5 px-4 text-center">Đăng ký ăn KTX</th>
              <th className="py-3.5 px-4 text-center">Trạng thái Bữa Sáng</th>
              <th className="py-3.5 px-4 text-center">Trạng thái Bữa Tối</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  Không tìm thấy nhân sự phù hợp.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, idx) => {
                const isBfEating =
                  (emp.has_meals && !emp.is_breakfast_absent) ||
                  (!emp.has_meals && !!emp.is_breakfast_extra);
                const isDnEating =
                  (emp.has_meals && !emp.is_dinner_absent) ||
                  (!emp.has_meals && !!emp.is_dinner_extra);

                return (
                  <tr key={emp.employee_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {emp.employee_code || `#${emp.employee_id}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{emp.name_latin}</span>
                      {emp.name_chinese && (
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {emp.name_chinese}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!emp.location_name || emp.location_name.includes("Chưa xếp") ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                          ⚠️ {emp.location_name || "Chưa xếp chỗ ở"}
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-800">{emp.location_name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleHasMeals(emp)}
                        title="Bấm để bật/tắt đăng ký ăn KTX mặc định cho nhân sự này"
                        className="cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        {emp.has_meals ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs hover:bg-emerald-200">
                            ✓ Có ăn
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200">
                            Không
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleAbsence(emp, "BREAKFAST")}
                        title="Bấm để chuyển đổi trạng thái suất ăn sáng ngày này"
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isBfEating
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : emp.has_meals
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 font-medium"
                        }`}
                      >
                        {isBfEating ? "🍳 Ăn sáng" : emp.has_meals ? "❌ Vắng ăn" : "❌ Không ăn"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleAbsence(emp, "DINNER")}
                        title="Bấm để chuyển đổi trạng thái suất ăn tối ngày này"
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isDnEating
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                            : emp.has_meals
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 font-medium"
                        }`}
                      >
                        {isDnEating ? "🍲 Ăn tối" : emp.has_meals ? "❌ Vắng ăn" : "❌ Không ăn"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
