import React, { useEffect, useState } from "react";
import { createVehicle, deleteVehicle, fetchVehicles, updateVehicle } from "../api";
import type { OwnershipGroup, Vehicle, VehicleCreatePayload } from "../types";

export const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTab, setActiveTab] = useState<OwnershipGroup | "ALL">("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleCreatePayload>({
    ownership_group: "COMPANY_OWNED",
    name: "",
    driver_name: "",
    license_plate: "",
    driver_phone: "",
    default_cost: 0,
  });

  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        ownership_group: vehicle.ownership_group,
        name: vehicle.name,
        driver_name: vehicle.driver_name || "",
        license_plate: vehicle.license_plate || "",
        driver_phone: vehicle.driver_phone || "",
        default_cost: vehicle.default_cost || 0,
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        ownership_group: activeTab === "OUTSOURCED" ? "OUTSOURCED" : "COMPANY_OWNED",
        name: "",
        driver_name: "",
        license_plate: "",
        driver_phone: "",
        default_cost: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, formData);
      } else {
        await createVehicle(formData);
      }
      setIsModalOpen(false);
      loadVehicles();
    } catch (err: any) {
      alert("Lỗi khi lưu thông tin xe: " + err.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa loại xe "${name}"?`)) return;
    try {
      await deleteVehicle(id);
      loadVehicles();
    } catch (err: any) {
      alert("Lỗi khi xóa loại xe: " + err.message);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (activeTab === "ALL") return true;
    return v.ownership_group === activeTab;
  });

  const companyCount = vehicles.filter((v) => v.ownership_group === "COMPANY_OWNED").length;
  const outsourcedCount = vehicles.filter((v) => v.ownership_group === "OUTSOURCED").length;

  return (
    <div className="space-y-6">
      {/* Sub-header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "ALL"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả loại xe ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab("COMPANY_OWNED")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "COMPANY_OWNED"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            🏢 Xe công ty ({companyCount})
          </button>
          <button
            onClick={() => setActiveTab("OUTSOURCED")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "OUTSOURCED"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            🚕 Xe thuê ngoài ({outsourcedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span>➕</span> Thêm Loại xe / Xe mới
          </button>
        </div>
      </div>

      {/* Loading & Error states */}
      {loading && <div className="text-center py-8 text-xs text-slate-500">Đang tải danh sách xe...</div>}
      {error && <div className="text-center py-8 text-xs text-red-500 font-medium">{error}</div>}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Nhóm sở hữu</th>
                  <th className="p-3">Tên Xe / Loại xe</th>
                  <th className="p-3">Tài xế mặc định</th>
                  <th className="p-3">Biển số xe</th>
                  <th className="p-3">SĐT Tài xế</th>
                  <th className="p-3 text-right">Đơn giá mặc định / chuyến</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      Chưa có dữ liệu xe nào.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v, index) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-medium text-slate-400">{index + 1}</td>
                      <td className="p-3 font-semibold">
                        {v.ownership_group === "COMPANY_OWNED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            🏢 Xe công ty
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            🚕 Xe thuê ngoài
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{v.name}</td>
                      <td className="p-3">{v.driver_name || "—"}</td>
                      <td className="p-3 font-mono text-slate-600">{v.license_plate || "—"}</td>
                      <td className="p-3">{v.driver_phone || "—"}</td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        {v.default_cost > 0 ? `${v.default_cost.toLocaleString("vi-VN")} đ` : "0 đ"}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(v)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(v.id, v.name)}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              {editingVehicle ? "Chỉnh sửa Loại xe / Xe" : "Thêm mới Loại xe / Xe"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhóm sở hữu xe <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.ownership_group}
                  onChange={(e) =>
                    setFormData({ ...formData, ownership_group: e.target.value as OwnershipGroup })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="COMPANY_OWNED">🏢 Xe công ty</option>
                  <option value="OUTSOURCED">🚕 Xe thuê ngoài</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Xe / Loại xe <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: A Ngọc, A Đại, Xe 7 chỗ..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tài xế mặc định</label>
                  <input
                    type="text"
                    value={formData.driver_name || ""}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Biển số xe</label>
                  <input
                    type="text"
                    value={formData.license_plate || ""}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    placeholder="VD: 29A-123.45"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Tài xế</label>
                  <input
                    type="text"
                    value={formData.driver_phone || ""}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đơn giá mặc định (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.default_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, default_cost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingVehicle ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
