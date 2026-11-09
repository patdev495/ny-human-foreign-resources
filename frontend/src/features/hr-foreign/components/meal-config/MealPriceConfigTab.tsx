import { systemField, systemPrimaryButton, systemSecondaryButton, systemTextButton } from "../../../../shared/components/systemStyles";
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
  const normalConfig = priceConfigs.find((cfg) => cfg.day_type === "NORMAL");

  const [dtCode, setDtCode] = useState<string>("TET");
  const [dtName, setDtName] = useState<string>("Tết Nguyên Đán");
  const [bfPrice, setBfPrice] = useState<number>(
    normalConfig ? normalConfig.foreign_breakfast_price : 30000
  );
  const [dnPrice, setDnPrice] = useState<number>(
    normalConfig ? normalConfig.foreign_dinner_price : 40000
  );
  const [lcPrice, setLcPrice] = useState<number>(
    normalConfig ? normalConfig.janitor_meal_price : 25000
  );
  const [fruitPrice, setFruitPrice] = useState<number>(
    normalConfig ? normalConfig.fruit_allowance_price : 60000
  );
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
    if (bfPrice <= 0 || dnPrice <= 0 || lcPrice <= 0 || fruitPrice <= 0) {
      setError("Tất cả đơn giá bữa ăn và tiền hoa quả phải lớn hơn 0 (không được bỏ trống)");
      return;
    }

    try {
      if (editingPriceConfigId !== null) {
        await updateMealPriceConfig(editingPriceConfigId, {
          day_type: dtCode.trim().toUpperCase(),
          day_type_name: dtName.trim() || dtCode.trim(),
          foreign_breakfast_price: Number(bfPrice),
          foreign_dinner_price: Number(dnPrice),
          janitor_meal_price: Number(lcPrice),
          fruit_allowance_price: Number(fruitPrice),
          notes: dtNotes.trim() || undefined,
        });
        setSuccessMsg(` Đã cập nhật loại ngày '${dtName || dtCode}' thành công!`);
        setEditingPriceConfigId(null);
      } else {
        await createMealPriceConfig({
          day_type: dtCode.trim().toUpperCase(),
          day_type_name: dtName.trim() || dtCode.trim(),
          foreign_breakfast_price: Number(bfPrice),
          foreign_dinner_price: Number(dnPrice),
          janitor_meal_price: Number(lcPrice),
          fruit_allowance_price: Number(fruitPrice),
          effective_from: new Date().toISOString().split("T")[0],
          notes: dtNotes.trim() || undefined,
        });
        setSuccessMsg(` Đã thêm loại ngày mới '${dtName || dtCode}' với đầy đủ 4 mức giá!`);
      }

      setDtCode("");
      setDtName("");
      setBfPrice(normalConfig ? normalConfig.foreign_breakfast_price : 30000);
      setDnPrice(normalConfig ? normalConfig.foreign_dinner_price : 40000);
      setLcPrice(normalConfig ? normalConfig.janitor_meal_price : 25000);
      setFruitPrice(normalConfig ? normalConfig.fruit_allowance_price : 60000);
      setDtNotes("");
      onDataChange();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể lưu cấu hình đơn giá");
    }
  };

  const handleStartEditPriceConfig = (cfg: MealPriceConfig) => {
    setEditingPriceConfigId(cfg.id);
    setDtCode(cfg.day_type);
    setDtName(cfg.day_type_name || cfg.day_type);
    setBfPrice(cfg.foreign_breakfast_price ?? normalConfig?.foreign_breakfast_price ?? 30000);
    setDnPrice(cfg.foreign_dinner_price ?? normalConfig?.foreign_dinner_price ?? 40000);
    setLcPrice(cfg.janitor_meal_price ?? normalConfig?.janitor_meal_price ?? 25000);
    setFruitPrice(cfg.fruit_allowance_price ?? normalConfig?.fruit_allowance_price ?? 60000);
    setDtNotes(cfg.notes || "");
  };

  const handleCancelEditPriceConfig = () => {
    setEditingPriceConfigId(null);
    setDtCode("");
    setDtName("");
    setBfPrice(normalConfig ? normalConfig.foreign_breakfast_price : 30000);
    setDnPrice(normalConfig ? normalConfig.foreign_dinner_price : 40000);
    setLcPrice(normalConfig ? normalConfig.janitor_meal_price : 25000);
    setFruitPrice(normalConfig ? normalConfig.fruit_allowance_price : 60000);
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
      setSuccessMsg(" Đã xóa cấu hình đơn giá!");
      onDataChange();
    } catch (err: unknown) {
      alert(`Lỗi khi xóa: ${err instanceof Error ? err.message : "Không thể thực hiện thao tác."}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-sm p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-2">
           {editingPriceConfigId !== null ? "Sửa Cấu hình Đơn giá" : "Thêm Loại ngày & Đơn giá Mới"}
        </h3>
        <form onSubmit={handleSavePriceConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="meal-day-code" className="block text-sm font-medium text-slate-700 mb-1">
                Mã Loại ngày (Viết hoa, không dấu)
              </label>
              <input id="meal-day-code"
                type="text"
                placeholder="VD: TET, LE_304, CONG_TY_KY_NIEM"
                value={dtCode}
                onChange={(e) => setDtCode(e.target.value)}
                disabled={editingPriceConfigId !== null}
                className={systemField}
              />
            </div>
            <div>
              <label htmlFor="meal-day-name" className="block text-sm font-medium text-slate-700 mb-1">
                Tên hiển thị Loại ngày
              </label>
              <input id="meal-day-name"
                type="text"
                placeholder="VD: Tết Nguyên Đán, Lễ Quốc Khánh..."
                value={dtName}
                onChange={(e) => setDtName(e.target.value)}
                className={systemField}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 bg-white p-3 rounded-sm border border-slate-200">
            <div>
              <label htmlFor="meal-breakfast-price" className="block text-xs font-semibold text-slate-700 mb-1">
                 Bữa Sáng (Nước ngoài) <span className="text-rose-500">*</span>
              </label>
              <input id="meal-breakfast-price"
                type="number"
                step={1}
                min={1000}
                value={bfPrice}
                onChange={(e) => setBfPrice(Number(e.target.value))}
                className={systemField}
                required
              />
            </div>

            <div>
              <label htmlFor="meal-dinner-price" className="block text-xs font-semibold text-slate-700 mb-1">
                 Bữa Tối (Nước ngoài) <span className="text-rose-500">*</span>
              </label>
              <input id="meal-dinner-price"
                type="number"
                step={1}
                min={1000}
                value={dnPrice}
                onChange={(e) => setDnPrice(Number(e.target.value))}
                className={systemField}
                required
              />
            </div>

            <div>
              <label htmlFor="meal-janitor-price" className="block text-xs font-semibold text-slate-700 mb-1">
                 1 Bữa Trưa (Tạp vụ) <span className="text-rose-500">*</span>
              </label>
              <input id="meal-janitor-price"
                type="number"
                step={1}
                min={1000}
                value={lcPrice}
                onChange={(e) => setLcPrice(Number(e.target.value))}
                className={systemField}
                required
              />
            </div>

            <div>
              <label htmlFor="meal-fruit-price" className="block text-xs font-semibold text-slate-700 mb-1">
                 Tiền Hoa quả (1 ngày) <span className="text-rose-500">*</span>
              </label>
              <input id="meal-fruit-price"
                type="number"
                step={1}
                min={1000}
                value={fruitPrice}
                onChange={(e) => setFruitPrice(Number(e.target.value))}
                className={systemField}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="meal-price-notes" className="block text-sm font-medium text-slate-700 mb-1">
              Ghi chú
            </label>
            <input id="meal-price-notes"
              type="text"
              placeholder="Ghi chú thêm về quy định đơn giá này..."
              value={dtNotes}
              onChange={(e) => setDtNotes(e.target.value)}
              className={systemField}
            />
          </div>

          <div className="flex justify-end space-x-3">
            {editingPriceConfigId !== null && (
              <button
                type="button"
                onClick={handleCancelEditPriceConfig}
                className={systemSecondaryButton}
              >
                Hủy chỉnh sửa
              </button>
            )}
            <button
              type="submit"
              className={systemPrimaryButton}
            >
              {editingPriceConfigId !== null ? " Cập nhật Đơn giá" : " Thêm Cấu hình"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="font-semibold text-slate-800">
            📊 Danh mục Loại ngày & Đơn giá ({priceConfigs.length})
          </h4>
        </div>
        <div className="overflow-x-auto" role="region" aria-label="Bảng đơn giá bữa ăn" tabIndex={0}>
          <table className="w-full min-w-[1050px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">STT</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Mã Loại ngày</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Tên Hiển thị</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Sáng NNN</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Tối NNN</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Trưa Tạp vụ</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Hoa quả</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Ghi chú</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {priceConfigs.map((cfg, idx) => {
                const bf = cfg.foreign_breakfast_price ?? 30000;
                const dn = cfg.foreign_dinner_price ?? 40000;
                const lc = cfg.janitor_meal_price ?? 25000;
                const fr = cfg.fruit_allowance_price ?? 60000;
                return (
                  <tr key={cfg.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{cfg.day_type}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {cfg.day_type_name || cfg.day_type}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {bf.toLocaleString()} VNĐ
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {dn.toLocaleString()} VNĐ
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {lc.toLocaleString()} VNĐ
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {fr.toLocaleString()} VNĐ
                    </td>
                    <td className="px-4 py-3 text-slate-600">{cfg.notes || "—"}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleStartEditPriceConfig(cfg)}
                        className={systemTextButton}
                      >
                        Sửa
                      </button>
                      {cfg.day_type !== "NORMAL" && (
                        <button
                          onClick={() => handleDeletePriceConfig(cfg)}
                          className="min-h-11 cursor-pointer text-sm text-red-700 hover:underline sm:min-h-9"
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
