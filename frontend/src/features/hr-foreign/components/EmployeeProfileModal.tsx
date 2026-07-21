import React, { useState, useEffect } from "react";
import type { EmployeeHistoryResponse } from "../types";
import { fetchEmployeeHistory } from "../api";

interface EmployeeProfileModalProps {
  employeeId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employeeId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<EmployeeHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"STAYS" | "VISAS" | "TAM_TRU">("STAYS");

  useEffect(() => {
    if (!employeeId || !isOpen) {
      setData(null);
      return;
    }
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetchEmployeeHistory(employeeId);
        setData(res);
      } catch (err) {
        console.error("Failed to load employee profile history:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [employeeId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <h3 className="text-lg font-bold">
              Hồ sơ Chi tiết 360° — {data?.employee.name_latin || "Đang tải..."}
            </h3>
            <p className="text-xs text-slate-400">
              Tra cứu toàn bộ lịch sử chỗ ở, thị thực & công tác của nhân sự
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {loading || !data ? (
          <div className="p-12 text-center text-slate-400">Đang tải toàn bộ dữ liệu lịch sử...</div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Master Personal Details Card */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Tên Latin:</span>
                <span className="font-bold text-slate-900 text-sm">{data.employee.name_latin}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Tên Trung Quốc:</span>
                <span className="font-semibold text-slate-800 text-sm">{data.employee.name_chinese || "-"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Số Hộ Chiếu:</span>
                <span className="font-mono font-bold text-blue-700 text-sm">{data.employee.passport_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Hạn Hộ Chiếu:</span>
                <span className="font-mono font-medium text-slate-800">{data.employee.passport_expiry || "-"}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Quốc Tịch / Giới tính:</span>
                <span className="font-medium text-slate-800">{data.employee.nationality} ({data.employee.gender})</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Bộ Phận / Chức Danh:</span>
                <span className="font-medium text-slate-800">{data.employee.department || "-"} / {data.employee.role || "-"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Số Điện Thoại:</span>
                <span className="font-mono font-medium text-slate-800">{data.employee.phone || "-"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Ngày Sinh:</span>
                <span className="font-mono text-slate-800">{data.employee.date_of_birth || "-"}</span>
              </div>
            </div>

            {/* History Tabs Navigation */}
            <div className="flex border-b border-slate-200 space-x-4">
              <button
                onClick={() => setActiveTab("STAYS")}
                className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === "STAYS"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Lịch sử Lưu trú & Chỗ ở ({data.stays.length})
              </button>
              <button
                onClick={() => setActiveTab("VISAS")}
                className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === "VISAS"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Lịch sử Thị thực Visa ({data.visas.length})
              </button>
              <button
                onClick={() => setActiveTab("TAM_TRU")}
                className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === "TAM_TRU"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Lịch sử Đăng ký Tạm trú ({data.tam_trus.length})
              </button>
            </div>

            {/* TAB CONTENT: STAYS */}
            {activeTab === "STAYS" && (
              <div className="space-y-3">
                {data.stays.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có lịch sử đợt lưu trú nào.</p>
                ) : (
                  data.stays.map((stay) => {
                    const isActive = !stay.end_date || stay.end_date >= new Date().toISOString().split("T")[0];
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
                        <div className="text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isActive ? "Đang lưu trú" : "Đã kết thúc"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT: VISAS */}
            {activeTab === "VISAS" && (
              <div className="space-y-3">
                {data.visas.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có lịch sử Visa nào.</p>
                ) : (
                  data.visas.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Visa loại {v.visa_type}</div>
                        <div className="text-slate-600 font-mono mt-0.5">
                          Nhập cảnh: {v.entry_date} &bull; Hết hạn: <span className="font-semibold text-blue-700">{v.expiry_date}</span>
                        </div>
                        {v.notes && <div className="text-slate-400 mt-0.5">{v.notes}</div>}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">Gắn với Stay #{v.stay_id}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: TAM TRU */}
            {activeTab === "TAM_TRU" && (
              <div className="space-y-3">
                {data.tam_trus.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có lịch sử Đăng ký tạm trú nào.</p>
                ) : (
                  data.tam_trus.map((tt) => (
                    <div
                      key={tt.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Khai báo Đăng ký Tạm trú</div>
                        <div className="text-slate-600 font-mono mt-0.5">
                          Ngày khai báo: {tt.registration_date} &bull; Hết hạn: <span className="font-semibold text-emerald-700">{tt.expiry_date}</span>
                        </div>
                        {tt.notes && <div className="text-slate-400 mt-0.5">{tt.notes}</div>}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">Gắn với Stay #{tt.stay_id}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs rounded-lg cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
