import React, { useState, useEffect } from "react";
import type { ForeignEmployee, ForeignEmployeeCreate } from "../types";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api";
import { EmployeeModal } from "./EmployeeModal";
import { EmployeeProfileModal } from "./EmployeeProfileModal";

interface EmployeeListProps {
  onSelectEmployee?: (emp: ForeignEmployee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_VN" | "RETURNED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<ForeignEmployee | null>(null);

  // 360 Profile History Modal state
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

  useEffect(() => {
    loadData(searchQuery);
  }, [searchQuery]);

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

  const openProfileHistory = (emp: ForeignEmployee) => {
    setProfileEmpId(emp.id);
    setIsProfileOpen(true);
    onSelectEmployee?.(emp);
  };

  const inVnCount = employees.filter((e) => e.is_in_vietnam).length;
  const returnedCount = employees.filter((e) => !e.is_in_vietnam).length;

  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter === "IN_VN") return emp.is_in_vietnam;
    if (statusFilter === "RETURNED") return !emp.is_in_vietnam;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Hồ sơ Nhân sự Nước ngoài</h2>
          <p className="text-sm text-slate-500">Danh sách nhân sự nước ngoài công tác & lưu trú</p>
        </div>
        <button
          onClick={() => {
            setEditingEmp(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs cursor-pointer transition-colors"
        >
          + Thêm Hồ sơ Nhân sự
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, hộ chiếu, bộ phận..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Presence Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Tất cả ({employees.length})
          </button>
          <button
            onClick={() => setStatusFilter("IN_VN")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${
              statusFilter === "IN_VN" ? "bg-emerald-600 text-white shadow-xs" : "hover:text-emerald-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            Đang ở VN ({inVnCount})
          </button>
          <button
            onClick={() => setStatusFilter("RETURNED")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${
              statusFilter === "RETURNED" ? "bg-rose-600 text-white shadow-xs" : "hover:text-rose-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-300"></span>
            Đã về nước ({returnedCount})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Tên Latin</th>
              <th className="px-4 py-3">Trạng thái Hiện diện</th>
              <th className="px-4 py-3">Tên Trung Quốc</th>
              <th className="px-4 py-3">Số Hộ Chiếu</th>
              <th className="px-4 py-3">Quốc Tịch</th>
              <th className="px-4 py-3">Chức Danh</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Đang tải danh sách...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Không tìm thấy nhân sự phù hợp.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">#{emp.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <button
                      onClick={() => openProfileHistory(emp)}
                      className="hover:underline text-blue-600 text-left cursor-pointer flex items-center gap-1.5"
                    >
                      {emp.name_latin}
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded font-normal">360°</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {emp.is_in_vietnam ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Đang ở VN {emp.current_room_number ? `(${emp.current_room_number})` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        Đã về nước
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{emp.name_chinese || "-"}</td>
                  <td className="px-4 py-3 font-mono font-medium">{emp.passport_number || "-"}</td>
                  <td className="px-4 py-3">{emp.nationality}</td>
                  <td className="px-4 py-3">{emp.role || "-"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openProfileHistory(emp)}
                      className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                    >
                      Lịch sử
                    </button>
                    <button
                      onClick={() => {
                        setEditingEmp(emp);
                        setIsModalOpen(true);
                      }}
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
