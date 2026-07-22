import React, { useState } from "react";
import type { WorkPermit } from "../types";
import { createWorkPermit, deleteWorkPermit, updateWorkPermit } from "../api";

interface WorkPermitSectionProps {
  employeeId: number;
  workPermits: WorkPermit[];
  onRefresh: () => void;
}

const ISSUE_TYPES = ["CẤP MỚI", "CẤP LẠI", "GIA HẠN", "CẤP ĐỔI", "MIỄN GPLĐ"];

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const getDaysRemaining = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const getValidity = (validTo?: string | null) => {
  const days = getDaysRemaining(validTo);
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= 90) return "expiring";
  return "active";
};

const validityConfig: Record<string, { label: string; cardCls: string; badgeCls: string }> = {
  active:   { label: "Còn hiệu lực", cardCls: "bg-white border-slate-200",      badgeCls: "bg-emerald-100 text-emerald-700" },
  expiring: { label: "Sắp hết hạn",  cardCls: "bg-yellow-50 border-yellow-200", badgeCls: "bg-yellow-100 text-yellow-700" },
  expired:  { label: "Hết hạn",      cardCls: "bg-red-50 border-red-200",       badgeCls: "bg-red-100 text-red-600" },
  unknown:  { label: "Không rõ hạn", cardCls: "bg-white border-slate-200",      badgeCls: "bg-slate-100 text-slate-500" },
};

type FormState = {
  permit_number: string;
  issue_type: string;
  issue_date: string;
  valid_from: string;
  valid_to: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  permit_number: "",
  issue_type: "CẤP MỚI",
  issue_date: "",
  valid_from: "",
  valid_to: "",
  notes: "",
};

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
    className="p-4 bg-amber-50 border border-amber-200 text-xs space-y-3"
  >
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Số GPLĐ</label>
        <input
          type="text"
          value={form.permit_number}
          onChange={(e) => onChange({ ...form, permit_number: e.target.value })}
          placeholder="VD: 024252001149"
          className="w-full p-1.5 border border-slate-300 rounded bg-white"
        />
      </div>
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Loại cấp</label>
        <select
          value={form.issue_type}
          onChange={(e) => onChange({ ...form, issue_type: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white"
        >
          {ISSUE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Ngày cấp</label>
        <input
          type="date"
          value={form.issue_date}
          onChange={(e) => onChange({ ...form, issue_date: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Hiệu lực từ</label>
          <input
            type="date"
            value={form.valid_from}
            onChange={(e) => onChange({ ...form, valid_from: e.target.value })}
            className="w-full p-1.5 border border-slate-300 rounded bg-white"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Đến ngày</label>
          <input
            type="date"
            value={form.valid_to}
            onChange={(e) => onChange({ ...form, valid_to: e.target.value })}
            className="w-full p-1.5 border border-slate-300 rounded bg-white"
          />
        </div>
      </div>
    </div>
    <div>
      <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Ghi chú</label>
      <input
        type="text"
        value={form.notes}
        onChange={(e) => onChange({ ...form, notes: e.target.value })}
        placeholder="Ghi chú (tuỳ chọn)"
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
        className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded cursor-pointer disabled:opacity-60 transition-colors"
      >
        {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm GPLĐ"}
      </button>
    </div>
  </form>
);

export const WorkPermitSection: React.FC<WorkPermitSectionProps> = ({
  employeeId,
  workPermits,
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

  const openEdit = (wp: WorkPermit) => {
    setShowAddForm(false);
    setEditingId(wp.id);
    setForm({
      permit_number: wp.permit_number ?? "",
      issue_type: wp.issue_type ?? "CẤP MỚI",
      issue_date: wp.issue_date ?? "",
      valid_from: wp.valid_from ?? "",
      valid_to: wp.valid_to ?? "",
      notes: wp.notes ?? "",
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
        permit_number: form.permit_number || null,
        issue_date: form.issue_date || null,
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        issue_type: form.issue_type || null,
        notes: form.notes || null,
      };
      if (editingId) {
        await updateWorkPermit(editingId, payload);
      } else {
        await createWorkPermit(employeeId, payload);
      }
      cancel();
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu Giấy phép lao động.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xóa bản ghi Giấy phép lao động này?")) return;
    try {
      await deleteWorkPermit(id);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Giấy phép lao động (GPLĐ)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi số GPLĐ, ngày cấp và hiệu lực
          </p>
        </div>
        <button
          onClick={showAddForm ? cancel : openAdd}
          className="px-3 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-lg border border-amber-200 cursor-pointer transition-colors"
        >
          {showAddForm ? "Huỷ" : "+ Thêm GPLĐ"}
        </button>
      </div>

      {/* Add form (top) */}
      {showAddForm && (
        <div className="rounded-lg overflow-hidden border border-amber-200">
          <InlineForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            onCancel={cancel}
            saving={saving}
            isEdit={false}
          />
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {workPermits.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400">
            Chưa có bản ghi GPLĐ nào.
          </div>
        ) : (
          workPermits.map((wp) => {
            const validity = getValidity(wp.valid_to);
            const { label, cardCls, badgeCls } = validityConfig[validity]!;
            const days = getDaysRemaining(wp.valid_to);
            const isEditing = editingId === wp.id;

            return (
              <div key={wp.id}>
                {/* Card */}
                <div
                  className={`p-3.5 rounded-lg border transition-all ${
                    isEditing ? "border-amber-400 bg-amber-50/50 rounded-b-none" : cardCls
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Info */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Số GPLĐ */}
                        <span className="font-bold text-sm text-slate-800 font-mono">
                          {wp.permit_number ?? "—"}
                        </span>
                        {/* Loại cấp */}
                        {wp.issue_type && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700 font-semibold">
                            {wp.issue_type}
                          </span>
                        )}
                        {/* Trạng thái */}
                        <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${badgeCls}`}>
                          {label}
                          {(validity === "expiring" || validity === "active") && days !== null && (
                            <span className="ml-1">· còn {days} ngày</span>
                          )}
                        </span>
                      </div>
                      {/* Dates */}
                      <div className="text-xs text-slate-500">
                        {wp.issue_date && (
                          <span>Cấp: <span className="text-slate-700 font-medium">{formatDate(wp.issue_date)}</span> · </span>
                        )}
                        Hiệu lực:{" "}
                        <span className="font-medium text-slate-700">
                          {formatDate(wp.valid_from)} → {formatDate(wp.valid_to)}
                        </span>
                      </div>
                      {wp.notes && (
                        <div className="text-xs text-slate-400 italic">{wp.notes}</div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-3 shrink-0 text-xs">
                      <button
                        onClick={() => (isEditing ? cancel() : openEdit(wp))}
                        className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        {isEditing ? "Đóng" : "Sửa"}
                      </button>
                      <button
                        onClick={() => handleDelete(wp.id)}
                        className="text-red-500 hover:text-red-700 font-medium cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <div className="border border-t-0 border-amber-400 rounded-b-lg overflow-hidden">
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
