import React, { useState, useEffect } from "react";
import type { ForeignEmployee } from "../types";
import { updateEmployee, fetchDocWarningConfigs } from "../api";
import { DocumentAttachmentSection } from "./DocumentAttachmentSection";

interface PassportSectionProps {
  employee: ForeignEmployee;
  onRefresh: () => void;
}

export const PassportSection: React.FC<PassportSectionProps> = ({
  employee,
  onRefresh,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [passportNumber, setPassportNumber] = useState(employee.passport_number || "");
  const [passportExpiry, setPassportExpiry] = useState(employee.passport_expiry || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPassportNumber(employee.passport_number || "");
    setPassportExpiry(employee.passport_expiry || "");
  }, [employee]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateEmployee(employee.id, {
        name_latin: employee.name_latin,
        name_chinese: employee.name_chinese || null,
        gender: employee.gender,
        nationality: employee.nationality || null,
        date_of_birth: employee.date_of_birth || null,
        phone: employee.phone || null,
        department: employee.department || null,
        role: employee.role || null,
        notes: employee.notes || null,
        required_exit_date: employee.required_exit_date || null,
        passport_number: passportNumber.trim() || null,
        passport_expiry: passportExpiry || null,
      });
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật hộ chiếu");
    } finally {
      setSaving(false);
    }
  };

  const [passportWarningDays, setPassportWarningDays] = useState(90);

  useEffect(() => {
    fetchDocWarningConfigs()
      .then((res) => {
        const passportCfg = res.configs.find((c) => c.doc_type === "PASSPORT");
        if (passportCfg) {
          const days = passportCfg.warning_unit === "MONTH" ? passportCfg.warning_value * 30 : passportCfg.warning_value;
          setPassportWarningDays(days);
        }
      })
      .catch(() => {});
  }, []);

  const getDaysRemaining = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const daysRem = getDaysRemaining(employee.passport_expiry);
  const isExpired = daysRem !== null && daysRem < 0;
  const isExpiringSoon = daysRem !== null && daysRem >= 0 && daysRem <= passportWarningDays;

  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h4 className="text-sm font-bold text-slate-800">Thông tin Hộ chiếu</h4>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Số hộ chiếu</label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="VD: E12345678"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Hạn hộ chiếu</label>
              <input
                type="date"
                value={passportExpiry}
                onChange={(e) => setPassportExpiry(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setPassportNumber(employee.passport_number || "");
                setPassportExpiry(employee.passport_expiry || "");
                setError(null);
              }}
              className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-60 transition-colors"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs py-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block mb-0.5">Số hộ chiếu</span>
              <span className="font-mono font-bold text-slate-800 text-base">
                {employee.passport_number || "Chưa thiết lập"}
              </span>
            </div>
            {employee.passport_number && (
              <span className="text-slate-300 text-2xl font-bold font-mono">#</span>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block mb-0.5">Hạn hộ chiếu</span>
              <span className="font-mono font-bold text-slate-800 text-base">
                {employee.passport_expiry || "Chưa thiết lập"}
              </span>
            </div>
            {employee.passport_expiry && (
              <div className="text-right">
                {isExpired ? (
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-bold">
                    Đã hết hạn
                  </span>
                ) : isExpiringSoon ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">
                    Còn {daysRem} ngày
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                    Còn {daysRem} ngày
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <DocumentAttachmentSection
        entityType="PASSPORT"
        entityId={employee.id}
        title="File đính kèm Hộ chiếu (Ảnh / PDF)"
      />
    </div>
  );
};
