import React, { useState, useEffect } from "react";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { getVisaLabel } from "../types";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api";
import { EmployeeModal } from "./EmployeeModal";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface EmployeeListProps {
  onSelectEmployee?: (emp: ForeignEmployee) => void;
}

// --- helpers ---

const getDays = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const targetTime = new Date(dateStr).getTime();
  const todayTime = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((targetTime - todayTime) / (1000 * 60 * 60 * 24));
};

type DocBadgeStatus = "missing" | "expired" | "warning" | "ok";

const classifyDays = (days: number | null, threshold: number): DocBadgeStatus => {
  if (days === null) return "missing";
  if (days <= 0) return "expired";
  if (days <= threshold) return "warning";
  return "ok";
};

const badgeConfig: Record<
  DocBadgeStatus,
  { label: (days: number | null) => string; cls: string }
> = {
  missing:  { label: () => "Thiếu TT",          cls: "bg-slate-100 text-slate-500 border-slate-200" },
  expired:  { label: (d) => (d !== null ? `Hết hạn (${d}d)` : "Hết hạn"), cls: "bg-red-100 text-red-800 border-red-300 font-bold" },
  warning:  { label: (d) => `${d} ngày`,         cls: "bg-amber-100 text-amber-800 border-amber-300 font-bold" },
  ok:       { label: (d) => `${d} ngày`,         cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const DocBadge: React.FC<{ dateStr?: string | null; label?: string; threshold: number }> = ({ dateStr, label, threshold }) => {
  const days = getDays(dateStr);
  const status = classifyDays(days, threshold);
  const { label: getLabel, cls } = badgeConfig[status];
  const text = label
    ? `${label}: ${status === "missing" ? "Thiếu TT" : status === "expired" ? "Hết hạn" : `${days} ngày`}`
    : getLabel(days);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${cls}`}>
      {status === "missing" && <span className="mr-1 opacity-60">–</span>}
      {status === "expired" && <span className="mr-1">⚠</span>}
      {text}
    </span>
  );
};

// Passport: uses passport_expiry field directly
const PassportBadge: React.FC<{ emp: ForeignEmployee; threshold: number }> = ({ emp, threshold }) => {
  if (!emp.passport_number) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-slate-100 text-slate-500 border-slate-200">Thiếu TT</span>;
  }
  if (!emp.passport_expiry) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded border text-[11px] font-semibold bg-amber-50 text-amber-600 border-amber-200">
        <span>⚠</span> Chưa có hạn
      </span>
    );
  }
  return <DocBadge dateStr={emp.passport_expiry} threshold={threshold} />;
};

const getEmployeeDocStatuses = (emp: ForeignEmployee, threshold: number): DocBadgeStatus[] => {
  const passportStatus: DocBadgeStatus = !emp.passport_number
    ? "missing"
    : !emp.passport_expiry
    ? "warning"
    : classifyDays(getDays(emp.passport_expiry), threshold);

  const gpldStatus = classifyDays(getDays(emp.latest_gpld_expiry), threshold);
  const visaStatus = classifyDays(getDays(emp.latest_visa_expiry), threshold);
  const tamtruStatus = classifyDays(getDays(emp.latest_tamtru_expiry), threshold);
  const contractStatus = classifyDays(getDays(emp.latest_contract_expiry), threshold);

  return [passportStatus, gpldStatus, visaStatus, tamtruStatus, contractStatus];
};


export const EmployeeList: React.FC<EmployeeListProps> = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_VN" | "RETURNED">("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState<
    "ALL" | "HAS_EXPIRED" | "HAS_WARNING" | "HAS_MISSING" | "ALL_OK"
  >("ALL");
  const [thresholdDays, setThresholdDays] = useState<number>(60);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<ForeignEmployee | null>(null);
  const [profileEmpId, setProfileEmpId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForeignEmployee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = async (q?: string) => {
    try {
      setLoading(true);
      const data = await fetchEmployees(q);
      setEmployees(data);
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(searchQuery); }, [searchQuery]);

  const handleCreateOrUpdate = async (payload: ForeignEmployeeCreate) => {
    if (editingEmp) {
      await updateEmployee(editingEmp.id, payload);
    } else {
      await createEmployee(payload);
    }
    loadData(searchQuery);
  };

  const handlePromptDelete = (emp: ForeignEmployee) => {
    setDeleteTarget(emp);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteEmployee(deleteTarget.id);
    loadData(searchQuery);
  };

  const openProfile = (emp: ForeignEmployee) => {
    setProfileEmpId(emp.id);
    setIsProfileOpen(true);
    onSelectEmployee?.(emp);
  };

  const inVnCount = employees.filter((e) => e.is_in_vietnam).length;
  const returnedCount = employees.filter((e) => !e.is_in_vietnam).length;

  const filtered = employees.filter((emp) => {
    if (statusFilter === "IN_VN" && !emp.is_in_vietnam) return false;
    if (statusFilter === "RETURNED" && emp.is_in_vietnam) return false;

    if (docStatusFilter !== "ALL") {
      const statuses = getEmployeeDocStatuses(emp, thresholdDays);
      if (docStatusFilter === "HAS_EXPIRED" && !statuses.includes("expired")) return false;
      if (docStatusFilter === "HAS_WARNING" && !statuses.includes("warning")) return false;
      if (docStatusFilter === "HAS_MISSING" && !statuses.includes("missing")) return false;
      if (docStatusFilter === "ALL_OK" && !statuses.every((s) => s === "ok")) return false;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Hồ sơ Nhân sự Nước ngoài</h2>
          <p className="text-sm text-slate-500">Danh sách nhân sự nước ngoài công tác & lưu trú</p>
        </div>
        <button
          onClick={() => { setEditingEmp(null); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs cursor-pointer transition-colors"
        >
          + Thêm Hồ sơ Nhân sự
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, hộ chiếu, bộ phận..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Dropdown Lọc Giấy tờ */}
          <select
            value={docStatusFilter}
            onChange={(e) => setDocStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-2xs w-full sm:w-auto"
          >
            <option value="ALL">📋 Tất cả trạng thái giấy tờ</option>
            <option value="HAS_EXPIRED">🔴 Có giấy tờ HẾT HẠN</option>
            <option value="HAS_WARNING">🟡 Có giấy tờ SẮP HẾT HẠN (≤ {thresholdDays}d)</option>
            <option value="HAS_MISSING">⚪ Có giấy tờ THIẾU THÔNG TIN</option>
            <option value="ALL_OK">🟢 Tất cả giấy tờ CÒN HẠN (&gt; {thresholdDays}d)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"}`}
          >
            Tất cả ({employees.length})
          </button>
          <button
            onClick={() => setStatusFilter("IN_VN")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${statusFilter === "IN_VN" ? "bg-emerald-600 text-white shadow-xs" : "hover:text-emerald-700"}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            Đang ở VN ({inVnCount})
          </button>
          <button
            onClick={() => setStatusFilter("RETURNED")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${statusFilter === "RETURNED" ? "bg-rose-600 text-white shadow-xs" : "hover:text-rose-700"}`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-300"></span>
            Đã về nước ({returnedCount})
          </button>
        </div>
      </div>

      {/* Threshold Selector & Legend */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700">Mốc cảnh báo giấy tờ:</span>
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            {[15, 30, 60, 90, 120].map((days) => (
              <button
                key={days}
                onClick={() => setThresholdDays(days)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  thresholdDays === days
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {days} ngày
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] flex-wrap">
          <span className="font-semibold text-slate-500">Màu giấy tờ:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
            🟢 Còn hạn (&gt; {thresholdDays}d)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-300 font-semibold">
            🟡 Sắp hết (≤ {thresholdDays}d)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-red-100 text-red-800 border-red-300 font-semibold">
            🔴 Đã hết hạn
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200 font-semibold">
            ⚪ Thiếu TT
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Tên nhân sự</th>
              <th className="px-4 py-3 whitespace-nowrap">Hiện diện</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Hộ chiếu</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">GPLĐ</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Visa</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Tạm trú</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Hợp đồng</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Đang tải danh sách...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Không tìm thấy nhân sự phù hợp.</td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  {/* Tên */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openProfile(emp)}
                      className="text-left hover:underline text-blue-700 font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      {emp.name_latin}
                      <span className="text-[10px] px-1.5 bg-blue-50 text-blue-500 rounded font-normal">360°</span>
                    </button>
                    {emp.employee_code && (
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.employee_code}</div>
                    )}
                  </td>

                  {/* Hiện diện */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {emp.is_in_vietnam ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Đang ở VN{emp.current_room_number ? ` (${emp.current_room_number})` : ""}
                          </span>
                          {!emp.current_room_number && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ⚠️ Chưa xếp phòng
                            </span>
                          )}
                          {emp.is_overdue_exit && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              ⏰ Quá hạn dự kiến về
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Đã về nước
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Hộ chiếu */}
                  <td className="px-4 py-3 text-center">
                    <PassportBadge emp={emp} threshold={thresholdDays} />
                  </td>

                  {/* GPLĐ */}
                  <td className="px-4 py-3 text-center">
                    <DocBadge dateStr={emp.latest_gpld_expiry} threshold={thresholdDays} />
                  </td>

                  {/* Visa */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <DocBadge dateStr={emp.latest_visa_expiry} threshold={thresholdDays} />
                      {emp.latest_visa_type && (
                        <span
                          title={getVisaLabel(emp.latest_visa_type)}
                          className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 whitespace-nowrap"
                        >
                          {getVisaLabel(emp.latest_visa_type)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tạm trú */}
                  <td className="px-4 py-3 text-center">
                    <DocBadge dateStr={emp.latest_tamtru_expiry} threshold={thresholdDays} />
                  </td>

                  {/* Hợp đồng */}
                  <td className="px-4 py-3 text-center">
                    <DocBadge dateStr={emp.latest_contract_expiry} threshold={thresholdDays} />
                  </td>

                  {/* Thao tác */}

                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openProfile(emp)}
                      className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                    >
                      Hồ sơ
                    </button>
                    <button
                      onClick={() => { setEditingEmp(emp); setIsModalOpen(true); }}
                      className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handlePromptDelete(emp)}
                      className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
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

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingEmp}
      />
      <EmployeeProfileModal
        employeeId={profileEmpId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleConfirmDelete}
          employeeName={`${deleteTarget.name_latin}${deleteTarget.name_chinese ? ` (${deleteTarget.name_chinese})` : ""}`}
          employeeCode={deleteTarget.employee_code}
          passportNumber={deleteTarget.passport_number}
          department={deleteTarget.department}
        />
      )}
    </div>
  );
};
