import React, { useState } from "react";
import type { Contract } from "../types";
import { createContract, deleteContract, updateContract } from "../api";

interface ContractSectionProps {
  employeeId: number;
  contracts: Contract[];
  onRefresh: () => void;
}

const CONTRACT_TYPES = ["CẤP MỚI", "GIA HẠN", "CẤP LẠI", "CHẤM DỨT SỚM"];

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const getDaysRemaining = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const getStatus = (start?: string | null, end?: string | null) => {
  const today = new Date().toISOString().split("T")[0]!;
  if (!end) return "unknown";
  if (end < today) return "expired";
  if (!start || start > today) return "pending";
  const days = getDaysRemaining(end);
  if (days !== null && days <= 90) return "expiring";
  return "active";
};

const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
  active:   { label: "Còn hiệu lực",  cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  expiring: { label: "Sắp hết hạn",   cls: "bg-yellow-100 text-yellow-700",   dot: "bg-yellow-500" },
  expired:  { label: "Đã hết hạn",    cls: "bg-red-100 text-red-600",         dot: "bg-red-500" },
  pending:  { label: "Chưa bắt đầu",  cls: "bg-slate-100 text-slate-500",     dot: "bg-slate-400" },
  unknown:  { label: "Không rõ hạn",  cls: "bg-slate-100 text-slate-400",     dot: "bg-slate-300" },
};

const typeConfig: Record<string, string> = {
  "CẤP MỚI":        "bg-blue-100 text-blue-700",
  "GIA HẠN":        "bg-indigo-100 text-indigo-700",
  "CẤP LẠI":        "bg-purple-100 text-purple-700",
  "CHẤM DỨT SỚM":  "bg-red-100 text-red-600",
};

type FormState = {
  contract_type: string;
  start_date: string;
  end_date: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  contract_type: "CẤP MỚI",
  start_date: "",
  end_date: "",
  notes: "",
};

/** Inline edit form shown directly under the card being edited */
const InlineForm: React.FC<{
  form: FormState;
  onChange: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}> = ({ form, onChange, onSubmit, onCancel, saving, isEdit }) => (
  <form
    onSubmit={onSubmit}
    className="mt-2 p-4 bg-indigo-50 rounded-lg border border-indigo-200 text-xs space-y-3"
  >
    <div className="grid grid-cols-2 gap-3">
      {/* Loại HĐ */}
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">
          Loại hợp đồng
        </label>
        <select
          value={form.contract_type}
          onChange={(e) => onChange({ ...form, contract_type: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white"
        >
          {CONTRACT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      {/* Placeholder để giữ layout */}
      <div />
      {/* Ngày bắt đầu */}
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">
          Ngày ký / bắt đầu
        </label>
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => onChange({ ...form, start_date: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white"
        />
      </div>
      {/* Ngày hết hạn */}
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">
          Ngày hết hạn
        </label>
        <input
          type="date"
          value={form.end_date}
          onChange={(e) => onChange({ ...form, end_date: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white"
        />
      </div>
    </div>
    {/* Ghi chú */}
    <div>
      <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">
        Ghi chú
      </label>
      <input
        type="text"
        value={form.notes}
        onChange={(e) => onChange({ ...form, notes: e.target.value })}
        placeholder="VD: Gia hạn lần 1, Lấy vợ VN..."
        className="w-full p-1.5 border border-slate-300 rounded bg-white"
      />
    </div>
    <div className="flex gap-2 justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
      >
        Huỷ
      </button>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded cursor-pointer disabled:opacity-60 transition-colors"
      >
        {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm HĐ"}
      </button>
    </div>
  </form>
);

export const ContractSection: React.FC<ContractSectionProps> = ({
  employeeId,
  contracts,
  onRefresh,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowAddForm(true);
  };

  const openEdit = (c: Contract) => {
    setShowAddForm(false);
    setEditingId(c.id);
    setForm({
      contract_type: c.contract_type ?? "CẤP MỚI",
      start_date: c.start_date ?? "",
      end_date: c.end_date ?? "",
      notes: c.notes ?? "",
    });
  };

  const cancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        contract_type: form.contract_type || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        notes: form.notes || null,
      };
      if (editingId) {
        await updateContract(editingId, payload);
      } else {
        await createContract(employeeId, payload);
      }
      cancel();
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu hợp đồng.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xoá hợp đồng này?")) return;
    try {
      await deleteContract(id);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xoá.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Hợp đồng lao động
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi các kỳ hợp đồng, ngày ký và hiệu lực
          </p>
        </div>
        <button
          onClick={showAddForm ? cancel : openAdd}
          className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 cursor-pointer transition-colors"
        >
          {showAddForm ? "Huỷ" : "+ Thêm HĐ"}
        </button>
      </div>

      {/* Add form (top, only when adding new) */}
      {showAddForm && (
        <InlineForm
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={cancel}
          saving={saving}
          isEdit={false}
        />
      )}

      {/* Contract list */}
      <div className="space-y-3">
        {contracts.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            Chưa có hợp đồng nào được ghi nhận.
          </div>
        ) : (
          contracts.map((c) => {
            const status = getStatus(c.start_date, c.end_date);
            const { label, cls, dot } = statusConfig[status]!;
            const typeCls = c.contract_type ? (typeConfig[c.contract_type] ?? "bg-slate-100 text-slate-600") : "";
            const days = getDaysRemaining(c.end_date);
            const isEditing = editingId === c.id;

            return (
              <div key={c.id}>
                {/* Card */}
                <div
                  className={`p-4 rounded-lg border transition-all ${
                    isEditing
                      ? "border-indigo-400 bg-indigo-50/50 rounded-b-none"
                      : status === "expired"
                      ? "bg-red-50 border-red-200"
                      : status === "expiring"
                      ? "bg-yellow-50 border-yellow-200"
                      : status === "active"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: info */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Badges row — same as what form has */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Loại HĐ */}
                        {c.contract_type && (
                          <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${typeCls}`}>
                            {c.contract_type}
                          </span>
                        )}
                        {/* Trạng thái hiệu lực */}
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] rounded font-semibold ${cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                          {label}
                          {(status === "expiring" || status === "active") && days !== null && (
                            <span className="ml-0.5">· còn {days} ngày</span>
                          )}
                        </span>
                      </div>
                      {/* Dates */}
                      <div className="text-xs text-slate-700 font-mono">
                        <span className="text-slate-500">Từ </span>
                        <span className="font-semibold">{formatDate(c.start_date)}</span>
                        <span className="text-slate-400 mx-1.5">→</span>
                        <span className="font-semibold">{formatDate(c.end_date)}</span>
                      </div>
                      {/* Notes */}
                      {c.notes && (
                        <div className="text-xs text-slate-500 italic">{c.notes}</div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-3 shrink-0 text-xs">
                      <button
                        onClick={() => (isEditing ? cancel() : openEdit(c))}
                        className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        {isEditing ? "Đóng" : "Sửa"}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700 font-medium cursor-pointer"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline edit form — appears directly below the card */}
                {isEditing && (
                  <div className="border border-t-0 border-indigo-400 rounded-b-lg overflow-hidden">
                    <InlineForm
                      form={form}
                      onChange={setForm}
                      onSubmit={handleSubmit}
                      onCancel={cancel}
                      saving={saving}
                      isEdit={true}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
