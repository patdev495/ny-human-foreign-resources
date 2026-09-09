import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  ShieldCheck,
  PlaneTakeoff,
  Home,
  FileCheck,
  BookOpen,
  Calendar,
  AlertTriangle,
  User,
} from "lucide-react";
import type { EmployeeHistoryResponse, ProfileTab, TravelRecord } from "../types";
import { fetchEmployeeHistory, deleteTravelRecord, deleteStay } from "../api";

import { WorkPermitSection } from "./WorkPermitSection";
import { ContractSection } from "./ContractSection";
import { VisaTamTruSection } from "./VisaTamTruSection";
import { TravelRecordModal } from "./TravelRecordModal";
import { PassportSection } from "./PassportSection";
import { ProfileStaysTab } from "./profile-modal/ProfileStaysTab";
import { ProfileTravelTab } from "./profile-modal/ProfileTravelTab";
import { EditSingleTravelRecordModal } from "./profile-modal/EditSingleTravelRecordModal";

export type { ProfileTab };

interface EmployeeProfileModalProps {
  employeeId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  initialTab?: ProfileTab;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employeeId,
  isOpen,
  onClose,
  onUpdate,
  initialTab,
}) => {
  const [data, setData] = useState<EmployeeHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("HOP_DONG");
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
  const [selectedTravelRecord, setSelectedTravelRecord] = useState<TravelRecord | null>(null);
  const [isEditSingleTravelOpen, setIsEditSingleTravelOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const hasMissingEntryDate = Boolean(
    data?.travel_records?.some(
      (tr: any) => !tr.entry_date && (Boolean(tr.actual_exit_date) || Boolean(tr.expected_exit_date))
    )
  );

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

  const handleRefresh = useCallback(async () => {
    await loadData();
    onUpdate?.();
  }, [loadData, onUpdate]);

  const handleDeleteTravelRecord = async (recordId: number) => {
    if (!employeeId) return;
    try {
      await deleteTravelRecord(employeeId, recordId);
      await handleRefresh();
    } catch (err: any) {
      alert(err.message || "Không thể xóa đợt nhập xuất cảnh");
    }
  };

  const handleDeleteStay = async (stayId: number) => {
    try {
      await deleteStay(stayId);
      await handleRefresh();
    } catch (err: any) {
      alert(err.message || "Không thể xóa đợt lưu trú");
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl h-[92vh] max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
              {data?.employee.name_latin?.slice(0, 2).toUpperCase() || <User className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold truncate text-white">
                  {data?.employee.name_latin || "Đang tải hồ sơ..."}
                </h3>
                {data?.employee.name_chinese && (
                  <span className="text-xs sm:text-sm font-semibold text-slate-300">
                    ({data.employee.name_chinese})
                  </span>
                )}
                {data?.employee.employee_code && (
                  <span className="font-mono text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                    {data.employee.employee_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Hồ sơ chi tiết 360° &bull; {data?.employee.department || "Chưa phân ban"} &bull; {data?.employee.nationality || "Nước ngoài"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hồ sơ"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !data ? (
          <div className="p-16 text-center text-slate-400 flex-1 flex items-center justify-center">
            <div className="space-y-3">
              <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Đang tải toàn bộ dữ liệu lịch sử nhân sự...</p>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
            {/* Master Personal Details Card */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Số Hộ Chiếu</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">{data.employee.passport_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Hạn Hộ Chiếu</span>
                  <span className="font-mono font-medium text-slate-800">{data.employee.passport_expiry || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Quốc Tịch / Giới tính</span>
                  <span className="font-medium text-slate-800">{data.employee.nationality} ({data.employee.gender})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Bộ Phận / Chức Danh</span>
                  <span className="font-medium text-slate-800">{data.employee.department || "-"} / {data.employee.role || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5 text-[11px]">Loại hình làm việc</span>
                  {data.employee.work_type === "CONG_TAC" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Công tác
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Cố định
                    </span>
                  )}
                </div>
              </div>

              {/* Travel / Presence Timeline Bar */}
              <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ngày đến VN</span>
                    <span className="font-mono font-bold text-slate-800">
                      {data.employee.is_in_vietnam ? (
                        data.employee.entry_date || "-"
                      ) : (
                        <span className="text-slate-400 italic font-normal">Chưa đến Việt Nam</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {data.employee.is_in_vietnam ? "Dự kiến về nước" : "Dự kiến sang"}
                    </span>
                    <span className="font-mono font-bold text-amber-700">
                      {data.employee.is_in_vietnam
                        ? data.employee.expected_exit_date || "-"
                        : data.employee.expected_entry_date || "-"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <Calendar className="h-4 w-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Thực tế đã về</span>
                    <span className="font-mono font-bold text-rose-700">
                      {data.employee.is_in_vietnam ? "Đang ở Việt Nam" : (data.employee.actual_exit_date || "-")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* History Tabs Navigation */}
            <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
              {[
                { id: "HOP_DONG", label: "Hợp đồng", count: data.contracts.length, icon: FileText },
                { id: "GPLD", label: "GPLĐ", count: data.work_permits.length, icon: ShieldCheck },
                { id: "TRAVEL_RECORDS", label: "Nhập xuất cảnh", count: data.travel_records?.length || 0, icon: PlaneTakeoff, warning: hasMissingEntryDate },
                { id: "STAYS", label: "Lưu trú & Chỗ ở", count: data.stays.length, icon: Home },
                { id: "VISA_TAM_TRU", label: "Visa & Tạm trú", count: data.visas.length + data.tam_trus.length, icon: FileCheck },
                { id: "PASSPORT", label: "Hộ chiếu", icon: BookOpen },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as ProfileTab)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                      isActive
                        ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                    }`}
                  >
                    <IconComponent className={`h-3.5 w-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.warning && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </button>
                );
              })}
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
              <ProfileStaysTab
                stays={data.stays}
                onDeleteStay={handleDeleteStay}
              />
            )}

            {/* TAB CONTENT: TRAVEL_RECORDS */}
            {activeTab === "TRAVEL_RECORDS" && (
              <ProfileTravelTab
                travelRecords={data.travel_records}
                onOpenTravelModal={() => setIsTravelModalOpen(true)}
                onEditRecord={(tr) => {
                  setSelectedTravelRecord(tr);
                  setIsEditSingleTravelOpen(true);
                }}
                onDeleteRecord={handleDeleteTravelRecord}
              />
            )}

            {/* TAB CONTENT: VISA_TAM_TRU */}
            {activeTab === "VISA_TAM_TRU" && (
              <VisaTamTruSection
                employeeId={data.employee.id}
                visas={data.visas}
                tamTrus={data.tam_trus}
                onRefresh={handleRefresh}
              />
            )}

            {/* TAB CONTENT: PASSPORT */}
            {activeTab === "PASSPORT" && (
              <PassportSection
                employee={data.employee}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        )}

        {/* Travel Record Modal */}
        {data && (
          <>
            <TravelRecordModal
              isOpen={isTravelModalOpen}
              onClose={() => setIsTravelModalOpen(false)}
              employee={data.employee}
              activeStay={data.stays.find((s) => !s.end_date)}
              onSuccess={handleRefresh}
            />
            <EditSingleTravelRecordModal
              isOpen={isEditSingleTravelOpen}
              onClose={() => {
                setIsEditSingleTravelOpen(false);
                setSelectedTravelRecord(null);
              }}
              employeeId={data.employee.id}
              travelRecord={selectedTravelRecord}
              onSuccess={handleRefresh}
            />
          </>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Mã nhân viên: <strong className="text-slate-800 font-mono font-bold">{data?.employee.employee_code || data?.employee.id || "-"}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
