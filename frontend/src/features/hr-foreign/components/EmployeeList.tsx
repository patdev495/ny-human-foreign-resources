import React, { useState, useEffect } from "react";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api";
import { EmployeeModal } from "./EmployeeModal";
import { EmployeeProfileModal } from "./EmployeeProfileModal";

interface EmployeeListProps {
  onSelectEmployee?: (emp: ForeignEmployee) => void;
}

// --- helpers ---

const getDays = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

type DocBadgeStatus = "missing" | "expired" | "critical" | "warning" | "ok";

const classifyDays = (days: number | null): DocBadgeStatus => {
  if (days === null) return "missing";
  if (days < 0) return "expired";
  if (days <= 30) return "critical";
  if (days <= 90) return "warning";
  return "ok";
};

const badgeConfig: Record<
  DocBadgeStatus,
  { label: (days: number | null) => string; cls: string }
> = {
  missing:  { label: () => "Thiếu TT",          cls: "bg-slate-100 text-slate-500 border-slate-200" },
  expired:  { label: () => "Hết hạn",            cls: "bg-red-100 text-red-700 border-red-200" },
  critical: { label: (d) => `${d} ngày`,         cls: "bg-red-50 text-red-600 border-red-200" },
  warning:  { label: (d) => `${d} ngày`,         cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  ok:       { label: (d) => `${d} ngày`,         cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const DocBadge: React.FC<{ dateStr?: string | null; label?: string }> = ({ dateStr, label }) => {
  const days = getDays(dateStr);
  const status = classifyDays(days);
  const { label: getLabel, cls } = badgeConfig[status]!;
  const text = label
    ? `${label}: ${status === "missing" ? "Thiếu TT" : status === "expired" ? "Hết hạn" : `${days} ngày`}`
    : getLabel(days);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${cls}`}>
      {status === "missing" && <span className="mr-1 opacity-60">–</span>}
      {(status === "expired") && <span className="mr-1">⚠</span>}
      {text}
    </span>
  );
};

// Passport: uses passport_expiry field directly
const PassportBadge: React.FC<{ emp: ForeignEmployee }> = ({ emp }) => {
  if (!emp.passport_number) {
    // No passport number at all
    return <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-slate-100 text-slate-500 border-slate-200">Thiếu TT</span>;
  }
  if (!emp.passport_expiry) {
    // Has number but no expiry — prompt user to fill in
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded border text-[11px] font-semibold bg-amber-50 text-amber-600 border-amber-200">
        <span>⚠</span> Chưa có hạn
      </span>
    );
  }
  return <DocBadge dateStr={emp.passport_expiry} />;
};


export const EmployeeList: React.FC<EmployeeListProps> = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_VN" | "RETURNED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<ForeignEmployee | null>(null);
  const [profileEmpId, setProfileEmpId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ nhân sự này?")) return;
    try {
      await deleteEmployee(id);
      loadData(searchQuery);
    } catch (err) {
      console.error(err);
      alert("Xóa không thành công.");
    }
  };

  const openProfile = (emp: ForeignEmployee) => {
    setProfileEmpId(emp.id);
    setIsProfileOpen(true);
    onSelectEmployee?.(emp);
  };

  const inVnCount = employees.filter((e) => e.is_in_vietnam).length;
  const returnedCount = employees.filter((e) => !e.is_in_vietnam).length;

  const filtered = employees.filter((emp) => {
    if (statusFilter === "IN_VN") return emp.is_in_vietnam;
    if (statusFilter === "RETURNED") return !emp.is_in_vietnam;
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
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, hộ chiếu, bộ phận..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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

      {/* Legend */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-600">Màu giấy tờ:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">Còn hạn</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-yellow-50 text-yellow-700 border-yellow-200 font-semibold">≤ 90 ngày</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-200 font-semibold">≤ 30 ngày / Hết hạn</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200 font-semibold">Thiếu TT</span>
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
                    {emp.is_in_vietnam ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Đang ở VN{emp.current_room_number ? ` (${emp.current_room_number})` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        Đã về nước
                      </span>
                    )}
                  </td>

                  {/* Hộ chiếu */}
                  <td className="px-4 py-3 text-center">
                    <PassportBadge emp={emp} />
                  </td>

                  {/* GPLĐ */}
                  <td className="px-4 py-3 text-center">
                    <DocBadge dateStr={emp.latest_gpld_expiry} />
                  </td>

                  {/* Visa */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <DocBadge dateStr={emp.latest_visa_expiry} />
                      {emp.latest_visa_type && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {emp.latest_visa_type}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tạm trú */}
                  <td className="px-4 py-3 text-center">
                    <DocBadge dateStr={emp.latest_tamtru_expiry} />
                  </td>

                  {/* Hợp đồng */}
                  <td className="px-4 py-3 text-center">
                    <DocBadge dateStr={emp.latest_contract_expiry} />
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
                      onClick={() => handleDelete(emp.id)}
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
    </div>
  );
};
