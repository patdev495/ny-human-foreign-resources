import React from "react";
import type { Vehicle } from "../../types";

interface Props {
  editingVehicle: Vehicle | null;
  setEditingVehicle: React.Dispatch<React.SetStateAction<Vehicle | null>>;
  onSave: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const MonthlyVehicleEditModal: React.FC<Props> = ({
  editingVehicle,
  setEditingVehicle,
  onSave,
  submitting,
}) => {
  if (!editingVehicle) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>✏️</span> Sửa Thông Tin Xe & Lái Xe
          </h3>
          <button
            onClick={() => setEditingVehicle(null)}
            className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Xe / Dòng Xe</label>
            <input
              type="text"
              value={editingVehicle.name}
              onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Biển Số Xe</label>
            <input
              type="text"
              value={editingVehicle.license_plate || ""}
              onChange={(e) => setEditingVehicle({ ...editingVehicle, license_plate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-800"
              placeholder="VD: 98A-369.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Họ Tên Lái Xe</label>
            <input
              type="text"
              value={editingVehicle.driver_name || ""}
              onChange={(e) => setEditingVehicle({ ...editingVehicle, driver_name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="VD: Anh Ngọc"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Số Điện Thoại Lái Xe</label>
            <input
              type="text"
              value={editingVehicle.driver_phone || ""}
              onChange={(e) => setEditingVehicle({ ...editingVehicle, driver_phone: e.target.value })}
              className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              placeholder="VD: 0972290559"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditingVehicle(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Đang lưu..." : "Lưu Thông Tin Xe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
