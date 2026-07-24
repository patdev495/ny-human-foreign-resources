import React, { useState } from "react";
import type { MealPriceConfig } from "../../types";
import {
  createMealPriceConfig,
  deleteMealPriceConfig,
  updateMealPriceConfig,
} from "../../api";

interface Props {
  priceConfigs: MealPriceConfig[];
  onDataChange: () => void;
  setError: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}

export const MealPriceConfigTab: React.FC<Props> = ({
  priceConfigs,
  onDataChange,
  setError,
  setSuccessMsg,
}) => {
  const [dtCode, setDtCode] = useState<string>("TET");
  const [dtName, setDtName] = useState<string>("Tết Nguyên Đán");
  const [dtPrice, setDtPrice] = useState<number>(60000);
  const [dtNotes, setDtNotes] = useState<string>("");

  const [editingPriceConfigId, setEditingPriceConfigId] = useState<number | null>(null);

  const handleSavePriceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!dtCode.trim()) {
      setError("Vui lòng nhập Mã loại ngày");
      return;
    }
    if (dtPrice <= 0) {
      setError("Đơn giá bữa ăn phải lớn hơn 0");
      return;
    }

    try {
      if (editingPriceConfigId !== null) {
        await updateMealPriceConfig(editingPriceConfigId, {
          day_type: dtCode.trim().toUpperCase(),
          day_type_name: dtName.trim() || dtCode.trim(),
          price_per_meal: Number(dtPrice),
          notes: dtNotes.trim() || undefined,
        });
        setSuccessMsg(`✓ Đã cập nhật loại ngày '${dtName || dtCode}' thành công!`);
        setEditingPriceConfigId(null);
      } else {
        await createMealPriceConfig({
          day_type: dtCode.trim().toUpperCase(),
          day_type_name: dtName.trim() || dtCode.trim(),
          price_per_meal: Number(dtPrice),
          effective_from: new Date().toISOString().split("T")[0],
          notes: dtNotes.trim() || undefined,
        });
        setSuccessMsg(`✓ Đã thêm loại ngày mới '${dtName || dtCode}' với đơn giá ${dtPrice.toLocaleString()} VNĐ!`);
      }

      setDtCode("");
      setDtName("");
      setDtPrice(30000);
      setDtNotes("");
      onDataChange();
    } catch (err: any) {
      setError(err.message || "Không thể lưu cấu hình đơn giá");
    }
  };

  const handleStartEditPriceConfig = (cfg: MealPriceConfig) => {
    setEditingPriceConfigId(cfg.id);
    setDtCode(cfg.day_type);
    setDtName(cfg.day_type_name || cfg.day_type);
    setDtPrice(cfg.price_per_meal);
    setDtNotes(cfg.notes || "");
  };

  const handleCancelEditPriceConfig = () => {
    setEditingPriceConfigId(null);
    setDtCode("");
    setDtName("");
    setDtPrice(30000);
    setDtNotes("");
  };

  const handleDeletePriceConfig = async (cfg: MealPriceConfig) => {
    if (cfg.day_type === "NORMAL") {
      alert("Không thể xóa cấu hình ngày bình thường (Mặc định hệ thống)!");
      return;
    }
    if (!window.confirm(`Xóa cấu hình loại ngày '${cfg.day_type_name || cfg.day_type}'?`)) return;

    try {
      await deleteMealPriceConfig(cfg.id);
      setSuccessMsg("✓ Đã xóa cấu hình đơn giá!");
      onDataChange();
    } catch (err: any) {
      alert(`Lỗi khi xóa: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-emerald-900 mb-2">
          💰 {editingPriceConfigId !== null ? "Sửa Cấu hình Đơn giá" : "Thêm Loại ngày & Đơn giá Mới"}
        </h3>
        <form onSubmit={handleSavePriceConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã Loại ngày (Viết hoa, không dấu)
              </label>
              <input
                type="text"
                placeholder="VD: TET, LE_304, CONG_TY_KY_NIEM"
                value={dtCode}
                onChange={(e) => setDtCode(e.target.value)}
                disabled={editingPriceConfigId !== null}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên hiển thị Loại ngày
              </label>
              <input
                type="text"
                placeholder="VD: Tết Nguyên Đán, Lễ Quốc Khánh..."
                value={dtName}
                onChange={(e) => setDtName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn giá Suất ăn (VNĐ/bữa)
              </label>
              <input
                type="number"
                step={1000}
                min={0}
                value={dtPrice}
                onChange={(e) => setDtPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <input
              type="text"
              placeholder="Ghi chú thêm về quy định đơn giá này..."
              value={dtNotes}
              onChange={(e) => setDtNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            {editingPriceConfigId !== null && (
              <button
                type="button"
                onClick={handleCancelEditPriceConfig}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md"
              >
                Hủy chỉnh sửa
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow transition duration-150"
            >
              {editingPriceConfigId !== null ? "💾 Cập nhật Đơn giá" : "➕ Thêm Cấu hình"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h4 className="font-semibold text-gray-800">
            📊 Danh mục Loại ngày & Đơn giá ({priceConfigs.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">STT</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Mã Loại ngày</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tên Hiển thị</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Đơn giá / Suất</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ghi chú</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {priceConfigs.map((cfg, idx) => (
                <tr key={cfg.id} className="hover:bg-emerald-50/50 transition">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{cfg.day_type}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-800">
                    {cfg.day_type_name || cfg.day_type}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    {cfg.price_per_meal.toLocaleString()} VNĐ
                  </td>
                  <td className="px-4 py-3 text-gray-600">{cfg.notes || "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleStartEditPriceConfig(cfg)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Sửa
                    </button>
                    {cfg.day_type !== "NORMAL" && (
                      <button
                        onClick={() => handleDeletePriceConfig(cfg)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
