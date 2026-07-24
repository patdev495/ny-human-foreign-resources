import React, { useState, useEffect } from "react";
import type { ForeignEmployee, MealAbsence, Stay } from "../../types";
import {
  createMealAbsence,
  deleteMealAbsence,
  fetchMealAbsences,
} from "../../api";

interface Props {
  stays: Stay[];
  employees: ForeignEmployee[];
  setError: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}

export const MealAbsencesTab: React.FC<Props> = ({
  stays,
  employees,
  setError,
  setSuccessMsg,
}) => {
  const [selectedStayId, setSelectedStayId] = useState<number | "">("");
  const [absences, setAbsences] = useState<MealAbsence[]>([]);
  const [absDate, setAbsDate] = useState("");
  const [absMealType, setAbsMealType] = useState<"BREAKFAST" | "DINNER" | "ALL_DAY">("ALL_DAY");
  const [absReason, setAbsReason] = useState("");

  useEffect(() => {
    if (stays.length > 0 && !selectedStayId) {
      setSelectedStayId(stays[0].id);
    }
  }, [stays, selectedStayId]);

  const loadAbsencesForStay = async (stayId: number) => {
    try {
      const data = await fetchMealAbsences(stayId);
      setAbsences(data);
    } catch (err) {
      console.error("Failed to fetch absences:", err);
    }
  };

  useEffect(() => {
    if (selectedStayId) {
      loadAbsencesForStay(Number(selectedStayId));
    } else {
      setAbsences([]);
    }
  }, [selectedStayId]);

  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStayId) return;
    if (!absDate) {
      setError("Vui lòng chọn ngày báo vắng");
      return;
    }

    try {
      await createMealAbsence(Number(selectedStayId), {
        absence_date: absDate,
        meal_type: absMealType,
        reason: absReason.trim() || undefined,
      });

      setSuccessMsg("✓ Đã đăng ký ngày báo vắng ăn thành công!");
      setAbsDate("");
      setAbsReason("");
      loadAbsencesForStay(Number(selectedStayId));
    } catch (err: any) {
      setError(err.message || "Không thể tạo ngày báo vắng");
    }
  };

  const handleDeleteAbsence = async (id: number) => {
    if (!window.confirm("Xóa ngày báo vắng ăn này?")) return;
    try {
      await deleteMealAbsence(id);
      setSuccessMsg("✓ Đã xóa ngày báo vắng");
      if (selectedStayId) loadAbsencesForStay(Number(selectedStayId));
    } catch (err: any) {
      alert(`Lỗi khi xóa: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-amber-900 mb-2">
          🍽️ Đăng ký Báo vắng ăn theo Lượt lưu trú
        </h3>
        <form onSubmit={handleCreateAbsence} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn Nhân sự / Đợt ở KTX
              </label>
              <select
                value={selectedStayId}
                onChange={(e) => setSelectedStayId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 font-medium"
              >
                {stays
                  .filter((s) => s.accommodation_type === "KTX")
                  .map((s) => {
                    const emp = employees.find((e) => e.id === s.employee_id);
                    return (
                      <option key={s.id} value={s.id}>
                        {emp ? emp.name_latin : `NV #${s.employee_id}`} - Phòng {s.room_number || "KTX"}
                      </option>
                    );
                  })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày báo vắng
              </label>
              <input
                type="date"
                value={absDate}
                onChange={(e) => setAbsDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bữa ăn cắt cơm
              </label>
              <select
                value={absMealType}
                onChange={(e) => setAbsMealType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 font-medium"
              >
                <option value="ALL_DAY">Cả ngày (Sáng & Tối)</option>
                <option value="BREAKFAST">Bữa Sáng</option>
                <option value="DINNER">Bữa Tối</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do báo vắng (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Đi công tác ngoài, Về quê nghỉ phép..."
              value={absReason}
              onChange={(e) => setAbsReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md shadow transition duration-150"
            >
              ➕ Đăng ký Vắng ăn
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h4 className="font-semibold text-gray-800">
            📋 Lịch sử Ngày báo vắng ăn của Nhân sự ({absences.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">STT</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ngày Báo vắng</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Bữa vắng ăn</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Lý do</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {absences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500 italic">
                    Chưa có ngày báo vắng nào cho đợt ở này.
                  </td>
                </tr>
              ) : (
                absences.map((ab, idx) => (
                  <tr key={ab.id} className="hover:bg-amber-50/50 transition">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{ab.absence_date}</td>
                    <td className="px-4 py-3 font-medium text-amber-800">
                      {ab.meal_type === "BREAKFAST"
                        ? "Bữa Sáng"
                        : ab.meal_type === "DINNER"
                        ? "Bữa Tối"
                        : "Cả ngày (Sáng & Tối)"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ab.reason || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteAbsence(ab.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
