import React from "react";
import type { MonthlyVehicleContract } from "../../types";

interface Props {
  editingContractPackage: {
    contract: MonthlyVehicleContract;
    linkedContractIds: number[];
  } | null;
  setEditingContractPackage: React.Dispatch<
    React.SetStateAction<{
      contract: MonthlyVehicleContract;
      linkedContractIds: number[];
    } | null>
  >;
  onSave: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const MonthlyContractEditModal: React.FC<Props> = ({
  editingContractPackage,
  setEditingContractPackage,
  onSave,
  submitting,
}) => {
  if (!editingContractPackage) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-base">Cập Nhật Bảng Giá Gói Hợp Đồng</h3>
          <button
            onClick={() => setEditingContractPackage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Hợp Đồng</label>
            <input
              type="text"
              value={editingContractPackage.contract.contract_name}
              onChange={(e) =>
                setEditingContractPackage({
                  ...editingContractPackage,
                  contract: { ...editingContractPackage.contract, contract_name: e.target.value },
                })
              }
              className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giá Thuê Tháng (VNĐ)</label>
              <input
                type="number"
                value={editingContractPackage.contract.base_monthly_cost}
                onChange={(e) =>
                  setEditingContractPackage({
                    ...editingContractPackage,
                    contract: { ...editingContractPackage.contract, base_monthly_cost: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn Mức Km / Tháng</label>
              <input
                type="number"
                value={editingContractPackage.contract.km_allowance}
                onChange={(e) =>
                  setEditingContractPackage({
                    ...editingContractPackage,
                    contract: { ...editingContractPackage.contract, km_allowance: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn Giá Phụ Trội Km (đ/km)</label>
              <input
                type="number"
                value={editingContractPackage.contract.excess_km_rate}
                onChange={(e) =>
                  setEditingContractPackage({
                    ...editingContractPackage,
                    contract: { ...editingContractPackage.contract, excess_km_rate: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tăng Ca Ngày Thường (đ/h)</label>
              <input
                type="number"
                value={editingContractPackage.contract.overtime_rate_weekday}
                onChange={(e) =>
                  setEditingContractPackage({
                    ...editingContractPackage,
                    contract: { ...editingContractPackage.contract, overtime_rate_weekday: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ Chuẩn (T2-T7)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingContractPackage.contract.standard_start_time}
                  onChange={(e) =>
                    setEditingContractPackage({
                      ...editingContractPackage,
                      contract: { ...editingContractPackage.contract, standard_start_time: e.target.value },
                    })
                  }
                  className="w-1/2 border border-slate-300 rounded-lg text-sm px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input
                  type="text"
                  value={editingContractPackage.contract.standard_end_time}
                  onChange={(e) =>
                    setEditingContractPackage({
                      ...editingContractPackage,
                      contract: { ...editingContractPackage.contract, standard_end_time: e.target.value },
                    })
                  }
                  className="w-1/2 border border-slate-300 rounded-lg text-sm px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ Chuẩn (Chủ Nhật)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingContractPackage.contract.sunday_standard_start_time || "07:30"}
                  onChange={(e) =>
                    setEditingContractPackage({
                      ...editingContractPackage,
                      contract: { ...editingContractPackage.contract, sunday_standard_start_time: e.target.value },
                    })
                  }
                  className="w-1/2 border border-slate-300 rounded-lg text-sm px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input
                  type="text"
                  value={editingContractPackage.contract.sunday_standard_end_time || "18:00"}
                  onChange={(e) =>
                    setEditingContractPackage({
                      ...editingContractPackage,
                      contract: { ...editingContractPackage.contract, sunday_standard_end_time: e.target.value },
                    })
                  }
                  className="w-1/2 border border-slate-300 rounded-lg text-sm px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mức Ngày Chủ Nhật (VNĐ)</label>
              <input
                type="number"
                value={editingContractPackage.contract.sunday_daily_rate}
                onChange={(e) =>
                  setEditingContractPackage({
                    ...editingContractPackage,
                    contract: { ...editingContractPackage.contract, sunday_daily_rate: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tăng Ca Chủ Nhật (đ/h)</label>
              <input
                type="number"
                value={editingContractPackage.contract.overtime_rate_weekend}
                onChange={(e) =>
                  setEditingContractPackage({
                    ...editingContractPackage,
                    contract: { ...editingContractPackage.contract, overtime_rate_weekend: Number(e.target.value) },
                  })
                }
                className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditingContractPackage(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Đang lưu..." : "Cập Nhật Bảng Giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
