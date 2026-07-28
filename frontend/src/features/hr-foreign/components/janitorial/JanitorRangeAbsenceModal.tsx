import React, { useState } from "react";
import type { ForeignEmployee } from "../../types";
import { saveJanitorRangeAbsence } from "../../api/janitorApi";

interface JanitorRangeAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: ForeignEmployee[];
  onSuccess: () => void;
}

export const JanitorRangeAbsenceModal: React.FC<JanitorRangeAbsenceModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSuccess,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">(
    employees.length > 0 ? employees[0].id : ""
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [absenceType, setAbsenceType] = useState<"FULL_DAY" | "HALF_DAY">(
    "FULL_DAY"
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert("Vui lòng chọn nhân viên tạp vụ.");
      return;
    }
    if (startDate > endDate) {
      alert("Từ ngày không thể lớn hơn Đến ngày.");
      return;
    }

    try {
      setSubmitting(true);
      await saveJanitorRangeAbsence({
        employee_id: Number(selectedEmployeeId),
        start_date: startDate,
        end_date: endDate,
        absence_type: absenceType,
        reason: reason.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Lỗi đăng ký nghỉ theo đợt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h3 className="font-bold text-slate-800 text-sm">
              Đăng ký Nghỉ theo Đợt (Khoảng ngày)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn Nhân viên Tạp vụ <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name_latin} ({emp.employee_code || "Không mã"}) -{" "}
                  {emp.workplace_location === "DORMITORY"
                    ? "KTX"
                    : emp.workplace_location === "CN09"
                    ? "CN09"
                    : emp.workplace_location === "CN15"
                    ? "CN15"
                    : "Công ty"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Từ ngày <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Đến ngày <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Hình thức nghỉ
            </label>
            <div className="flex gap-4 items-center mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="absenceType"
                  value="FULL_DAY"
                  checked={absenceType === "FULL_DAY"}
                  onChange={() => setAbsenceType("FULL_DAY")}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">
                  Nghỉ cả ngày (1.0 công)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="absenceType"
                  value="HALF_DAY"
                  checked={absenceType === "HALF_DAY"}
                  onChange={() => setAbsenceType("HALF_DAY")}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">
                  Nghỉ nửa ngày (0.5 công)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Lý do nghỉ (nếu có)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Nghỉ phép, nghỉ ốm, việc gia đình..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Đang lưu..." : "Xác nhận Đăng ký"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
