import React, { useState, useEffect } from "react";
import type { DocWarningConfigUpdateItem } from "../types";
import { fetchDocWarningConfigs, updateDocWarningConfigs } from "../api";

interface DocWarningConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const DOC_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  VISA: { label: "Visa / Thị thực", icon: "🛂" },
  TAM_TRU: { label: "Đăng ký Tạm trú", icon: "🏠" },
  GPLD: { label: "Giấy phép lao động (GPLĐ)", icon: "💼" },
  CONTRACT: { label: "Hợp đồng lao động", icon: "📜" },
  PASSPORT: { label: "Hộ chiếu (Passport)", icon: "📘" },
};

const DOC_TYPE_ORDER = ["VISA", "TAM_TRU", "GPLD", "CONTRACT", "PASSPORT"];

export const DocWarningConfigModal: React.FC<DocWarningConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [configs, setConfigs] = useState<Record<string, { warning_value: number; warning_unit: "DAY" | "MONTH" }>>({
    VISA: { warning_value: 30, warning_unit: "DAY" },
    TAM_TRU: { warning_value: 30, warning_unit: "DAY" },
    GPLD: { warning_value: 30, warning_unit: "DAY" },
    CONTRACT: { warning_value: 30, warning_unit: "DAY" },
    PASSPORT: { warning_value: 30, warning_unit: "DAY" },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDocWarningConfigs();
      const map: Record<string, { warning_value: number; warning_unit: "DAY" | "MONTH" }> = {};
      res.configs.forEach((item) => {
        map[item.doc_type] = {
          warning_value: item.warning_value,
          warning_unit: item.warning_unit as "DAY" | "MONTH",
        };
      });
      setConfigs((prev) => ({ ...prev, ...map }));
    } catch (err: any) {
      console.error("Failed to load doc warning configs:", err);
      setError("Không thể tải cấu hình mốc cảnh báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChangeValue = (docType: string, val: number) => {
    setConfigs((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        warning_value: Math.max(1, val),
      },
    }));
  };

  const handleChangeUnit = (docType: string, unit: "DAY" | "MONTH") => {
    setConfigs((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        warning_unit: unit,
      },
    }));
  };

  const handleResetDefaults = () => {
    setConfigs({
      VISA: { warning_value: 30, warning_unit: "DAY" },
      TAM_TRU: { warning_value: 30, warning_unit: "DAY" },
      GPLD: { warning_value: 30, warning_unit: "DAY" },
      CONTRACT: { warning_value: 30, warning_unit: "DAY" },
      PASSPORT: { warning_value: 30, warning_unit: "DAY" },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload: DocWarningConfigUpdateItem[] = DOC_TYPE_ORDER.map((docType) => ({
        doc_type: docType as any,
        warning_value: configs[docType]?.warning_value || 30,
        warning_unit: configs[docType]?.warning_unit || "DAY",
      }));

      await updateDocWarningConfigs(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật cấu hình mốc");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>⚙️</span> Cấu hình Mốc Cảnh báo Giấy tờ
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Thiết lập mốc thời gian cảnh báo hết hạn riêng cho từng loại giấy tờ
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Đang tải cấu hình...</div>
          ) : (
            <div className="space-y-3">
              {DOC_TYPE_ORDER.map((docType) => {
                const info = DOC_TYPE_LABELS[docType];
                const itemConfig = configs[docType] || { warning_value: 30, warning_unit: "DAY" };
                return (
                  <div
                    key={docType}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-xs font-bold text-slate-800">{info.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={itemConfig.warning_value}
                        onChange={(e) => handleChangeValue(docType, parseInt(e.target.value) || 1)}
                        className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={itemConfig.warning_unit}
                        onChange={(e) => handleChangeUnit(docType, e.target.value as "DAY" | "MONTH")}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="DAY">Ngày</option>
                        <option value="MONTH">Tháng</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Đặt lại mặc định (30 ngày)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer disabled:opacity-60 transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
