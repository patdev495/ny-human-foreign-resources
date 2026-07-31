import React, { useState, useEffect, useCallback } from "react";
import type { EmployeeHistoryResponse, ProfileTab } from "../types";
import { fetchEmployeeHistory } from "../api";

import { WorkPermitSection } from "./WorkPermitSection";
import { ContractSection } from "./ContractSection";
import { VisaTamTruSection } from "./VisaTamTruSection";
import { TravelRecordModal } from "./TravelRecordModal";
import { PassportSection } from "./PassportSection";
import { ProfileStaysTab } from "./profile-modal/ProfileStaysTab";
import { ProfileTravelTab } from "./profile-modal/ProfileTravelTab";

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
        <div className="px-6 py-4 border-b border-sky-600/30 flex justify-between items-center bg-gradient-to-r from-sky-700 to-blue-800 text-white">
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
              <ProfileStaysTab stays={data.stays} />
            )}

            {/* TAB CONTENT: TRAVEL_RECORDS */}
            {activeTab === "TRAVEL_RECORDS" && (
              <ProfileTravelTab
                travelRecords={data.travel_records}
                onOpenTravelModal={() => setIsTravelModalOpen(true)}
              />
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
