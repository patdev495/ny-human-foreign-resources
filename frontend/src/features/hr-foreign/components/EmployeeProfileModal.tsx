import React, { useState, useEffect, useCallback } from "react";
import type { EmployeeHistoryResponse, ForeignEmployee, ProfileTab } from "../types";
import { fetchEmployeeHistory, updateEmployee, fetchDocWarningConfigs } from "../api";

import { WorkPermitSection } from "./WorkPermitSection";
import { ContractSection } from "./ContractSection";
import { VisaTamTruSection } from "./VisaTamTruSection";
import { DocumentAttachmentSection } from "./DocumentAttachmentSection";
import { TravelRecordModal } from "./TravelRecordModal";



interface PassportSectionProps {
  employee: ForeignEmployee;
  onRefresh: () => void;
}

export const PassportSection: React.FC<PassportSectionProps> = ({
  employee,
  onRefresh,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [passportNumber, setPassportNumber] = useState(employee.passport_number || "");
  const [passportExpiry, setPassportExpiry] = useState(employee.passport_expiry || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPassportNumber(employee.passport_number || "");
    setPassportExpiry(employee.passport_expiry || "");
  }, [employee]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateEmployee(employee.id, {
        name_latin: employee.name_latin,
        name_chinese: employee.name_chinese || null,
        gender: employee.gender,
        nationality: employee.nationality || null,
        date_of_birth: employee.date_of_birth || null,
        phone: employee.phone || null,
        department: employee.department || null,
        role: employee.role || null,
        notes: employee.notes || null,
        required_exit_date: employee.required_exit_date || null,
        passport_number: passportNumber.trim() || null,
        passport_expiry: passportExpiry || null,
      });
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật hộ chiếu");
    } finally {
      setSaving(false);
    }
  };

  const [passportWarningDays, setPassportWarningDays] = useState(90);

  useEffect(() => {
    fetchDocWarningConfigs()
      .then((res) => {
        const passportCfg = res.configs.find((c) => c.doc_type === "PASSPORT");
        if (passportCfg) {
          const days = passportCfg.warning_unit === "MONTH" ? passportCfg.warning_value * 30 : passportCfg.warning_value;
          setPassportWarningDays(days);
        }
      })
      .catch(() => {});
  }, []);

  const getDaysRemaining = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const daysRem = getDaysRemaining(employee.passport_expiry);
  const isExpired = daysRem !== null && daysRem < 0;
  const isExpiringSoon = daysRem !== null && daysRem >= 0 && daysRem <= passportWarningDays;


  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800">Thông tin Hộ chiếu</h4>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Số hộ chiếu</label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="VD: E12345678"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Hạn hộ chiếu</label>
              <input
                type="date"
                value={passportExpiry}
                onChange={(e) => setPassportExpiry(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setPassportNumber(employee.passport_number || "");
                setPassportExpiry(employee.passport_expiry || "");
                setError(null);
              }}
              className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-60 transition-colors"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs py-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block mb-0.5">Số hộ chiếu</span>
              <span className="font-mono font-bold text-slate-800 text-base">
                {employee.passport_number || "Chưa thiết lập"}
              </span>
            </div>
            {employee.passport_number && (
              <span className="text-slate-300 text-2xl font-bold font-mono">#</span>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block mb-0.5">Hạn hộ chiếu</span>
              <span className="font-mono font-bold text-slate-800 text-base">
                {employee.passport_expiry || "Chưa thiết lập"}
              </span>
            </div>
            {employee.passport_expiry && (
              <div className="text-right">
                {isExpired ? (
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-bold">
                    Đã hết hạn
                  </span>
                ) : isExpiringSoon ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">
                    Còn {daysRem} ngày
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                    Còn {daysRem} ngày
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <DocumentAttachmentSection
        entityType="PASSPORT"
        entityId={employee.id}
        title="File đính kèm Hộ chiếu (Ảnh / PDF)"
      />
    </div>
  );
};

export type { ProfileTab };

interface EmployeeProfileModalProps {
  employeeId: number | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ProfileTab;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employeeId,
  isOpen,
  onClose,
  initialTab,
}) => {
  const [data, setData] = useState<EmployeeHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("HOP_DONG");
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);



  const loadData = useCallback(async () => {
    if (!employeeId || !isOpen) { setData(null); return; }
    try {
      setLoading(true);
      const res = await fetchEmployeeHistory(employeeId);
      setData(res);
    } catch (err) {
      console.error("Failed to load employee profile history:", err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, isOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
                <span className="text-slate-500 block mb-0.5">Mã nhân viên:</span>
                <span className="font-mono font-bold text-slate-700 text-sm">{data.employee.employee_code || "-"}</span>
              </div>
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
                <span className="text-slate-500 block mb-0.5">Loại hình làm việc:</span>
                {data.employee.work_type === "CONG_TAC" ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                    Công tác
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                    Cố định
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Ngày Sinh:</span>
                <span className="font-mono text-slate-800">{data.employee.date_of_birth || "-"}</span>
              </div>
              <div className="col-span-2 sm:col-span-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                  <div>
                    <span className="text-slate-500 block mb-0.5">📅 Ngày đến Việt Nam:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {data.employee.entry_date && !data.employee.actual_exit_date ? (
                        data.employee.entry_date
                      ) : (
                        <span className="text-slate-400 italic font-normal">Chưa đến Việt Nam</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">
                      {data.employee.entry_date && !data.employee.actual_exit_date
                        ? "⏳ Ngày dự kiến về:"
                        : "⏳ Ngày dự kiến sang:"}
                    </span>
                    <span className="font-mono font-bold text-amber-700">
                      {data.employee.entry_date && !data.employee.actual_exit_date
                        ? data.employee.expected_exit_date || data.employee.required_exit_date || "-"
                        : data.employee.expected_entry_date || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">✈️ Ngày thực tế đã về:</span>
                    <span className="font-mono font-bold text-rose-700">
                      {data.employee.entry_date && !data.employee.actual_exit_date ? (
                        "Chưa về nước"
                      ) : (
                        data.employee.actual_exit_date || "-"
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => setIsTravelModalOpen(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <span>+</span> Cập nhật ngày
                  </button>
                </div>
              </div>
            </div>

            {/* History Tabs Navigation */}
            <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab("HOP_DONG")}
                className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "HOP_DONG"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Hợp đồng ({data.contracts.length})
              </button>
              <button
                onClick={() => setActiveTab("GPLD")}
                className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "GPLD"
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                GPLĐ ({data.work_permits.length})
              </button>
              <button
                onClick={() => setActiveTab("TRAVEL_RECORDS")}
                className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "TRAVEL_RECORDS"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Nhập xuất cảnh ({data.travel_records?.length || 0})
              </button>
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
                onClick={() => setActiveTab("VISA_TAM_TRU")}
                className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === "VISA_TAM_TRU"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Visa & Tạm trú ({data.visas.length + data.tam_trus.length})
              </button>
              <button
                onClick={() => setActiveTab("PASSPORT")}
                className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "PASSPORT"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Hộ chiếu
              </button>
            </div>

            {/* TAB CONTENT: HOP DONG */}
            {activeTab === "HOP_DONG" && (
              <ContractSection
                employeeId={data.employee.id}
                contracts={data.contracts}
                onRefresh={loadData}
              />
            )}

            {/* TAB CONTENT: GPLD */}
            {activeTab === "GPLD" && (
              <WorkPermitSection
                employeeId={data.employee.id}
                workPermits={data.work_permits}
                onRefresh={loadData}
              />
            )}

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

            {/* TAB CONTENT: TRAVEL_RECORDS */}
            {activeTab === "TRAVEL_RECORDS" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2">
                  <h4 className="text-xs font-bold text-slate-700">Lịch sử Nhập xuất cảnh ({data.travel_records?.length || 0} đợt)</h4>
                  <button
                    onClick={() => setIsTravelModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    + Thêm / Cập nhật đợt
                  </button>
                </div>
                {!data.travel_records || data.travel_records.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Chưa ghi nhận lịch sử đợt nhập xuất cảnh nào.</p>
                ) : (
                  data.travel_records.map((tr, index) => {
                    const isOpenTrip = !tr.actual_exit_date;
                    return (
                      <div
                        key={tr.id || index}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Đợt #{data.travel_records.length - index}</span>
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
                            <div>📅 Đến: <span className="font-bold">{tr.entry_date || "-"}</span></div>
                            <div>⏳ Dự kiến về: <span className="font-medium text-amber-700">{tr.expected_exit_date || "-"}</span></div>
                            <div>✈️ Thực tế về: <span className="font-bold text-rose-700">{tr.actual_exit_date || "Chưa về nước"}</span></div>
                          </div>
                          {tr.notes && <div className="text-slate-400 italic text-[11px] pt-0.5">{tr.notes}</div>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT: VISA_TAM_TRU */}
            {activeTab === "VISA_TAM_TRU" && (
              <VisaTamTruSection
                stays={data.stays}
                visas={data.visas}
                tamTrus={data.tam_trus}
                onRefresh={loadData}
              />
            )}

            {/* TAB CONTENT: PASSPORT */}
            {activeTab === "PASSPORT" && (
              <PassportSection
                employee={data.employee}
                onRefresh={loadData}
              />
            )}
          </div>
        )}

        {/* Travel Record Modal */}
        {data && (
          <TravelRecordModal
            isOpen={isTravelModalOpen}
            onClose={() => setIsTravelModalOpen(false)}
            employee={data.employee}
            activeStay={data.stays.find((s) => !s.end_date)}
            onSuccess={loadData}
          />
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
