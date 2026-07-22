import React, { useState, useEffect, useCallback } from "react";
import type { Stay, TamTru, Visa } from "../types";
import {
  createVisa, deleteVisa, updateVisa,
  createTamTru, deleteTamTru, updateTamTru,
  fetchVisas, fetchTamTrus,
} from "../api";


interface VisaTamTruSectionProps {
  stays: Stay[];
  visas: Visa[];
  tamTrus: TamTru[];
  onRefresh: () => void;
}

const VISA_TYPES = ["DN1", "DN", "LĐ1", "LĐ2", "NG", "HH", "DL", "TT"];

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const getDays = (d?: string | null) =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

const ExpiryBadge: React.FC<{ dateStr?: string | null }> = ({ dateStr }) => {
  const days = getDays(dateStr);
  if (days === null) return <span className="text-slate-400 text-[11px]">—</span>;
  if (days < 0) return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Hết hạn</span>;
  if (days <= 30) return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600">còn {days} ngày</span>;
  if (days <= 90) return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-50 text-yellow-700">còn {days} ngày</span>;
  return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">còn {days} ngày</span>;
};

// ---- VISA SECTION ----
type VisaForm = { visa_type: string; entry_date: string; expiry_date: string; notes: string };
const EMPTY_VISA: VisaForm = { visa_type: "DN1", entry_date: "", expiry_date: "", notes: "" };

const VisaInlineForm: React.FC<{
  form: VisaForm; onChange: (f: VisaForm) => void;
  onSubmit: (e: React.FormEvent) => void; onCancel: () => void;
  saving: boolean; isEdit: boolean;
}> = ({ form, onChange, onSubmit, onCancel, saving, isEdit }) => (
  <form onSubmit={onSubmit} className="p-3.5 bg-blue-50 border border-blue-200 text-xs space-y-2.5">
    <div className="grid grid-cols-3 gap-2">
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Loại Visa</label>
        <select value={form.visa_type} onChange={(e) => onChange({ ...form, visa_type: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white">
          {VISA_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Ngày nhập cảnh</label>
        <input type="date" value={form.entry_date} onChange={(e) => onChange({ ...form, entry_date: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white" />
      </div>
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Ngày hết hạn</label>
        <input type="date" value={form.expiry_date} onChange={(e) => onChange({ ...form, expiry_date: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white" />
      </div>
    </div>
    <div className="flex gap-2">
      <input type="text" value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })}
        placeholder="Ghi chú (tùy chọn)" className="flex-1 p-1.5 border border-slate-300 rounded bg-white" />
      <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 cursor-pointer">Huỷ</button>
      <button type="submit" disabled={saving} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded cursor-pointer disabled:opacity-60">
        {saving ? "..." : isEdit ? "Cập nhật" : "Thêm Visa"}
      </button>
    </div>
  </form>
);

// ---- TAM TRU SECTION ----
type TamTruForm = { registration_date: string; expiry_date: string; notes: string };
const EMPTY_TAMTRU: TamTruForm = { registration_date: "", expiry_date: "", notes: "" };

const TamTruInlineForm: React.FC<{
  form: TamTruForm; onChange: (f: TamTruForm) => void;
  onSubmit: (e: React.FormEvent) => void; onCancel: () => void;
  saving: boolean; isEdit: boolean;
}> = ({ form, onChange, onSubmit, onCancel, saving, isEdit }) => (
  <form onSubmit={onSubmit} className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs space-y-2.5">
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Ngày khai báo</label>
        <input type="date" value={form.registration_date} onChange={(e) => onChange({ ...form, registration_date: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white" />
      </div>
      <div>
        <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">Ngày hết hạn tạm trú</label>
        <input type="date" value={form.expiry_date} onChange={(e) => onChange({ ...form, expiry_date: e.target.value })}
          className="w-full p-1.5 border border-slate-300 rounded bg-white" />
      </div>
    </div>
    <div className="flex gap-2">
      <input type="text" value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })}
        placeholder="Ghi chú (Cơ quan CA, số tờ khai...)" className="flex-1 p-1.5 border border-slate-300 rounded bg-white" />
      <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 cursor-pointer">Huỷ</button>
      <button type="submit" disabled={saving} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer disabled:opacity-60">
        {saving ? "..." : isEdit ? "Cập nhật" : "Thêm Tạm trú"}
      </button>
    </div>
  </form>
);

// ---- MAIN COMPONENT ----
export const VisaTamTruSection: React.FC<VisaTamTruSectionProps> = ({
  stays, visas, tamTrus, onRefresh,
}) => {
  // Pick the active (or latest) stay for creating new records
  const today = new Date().toISOString().split("T")[0]!;
  const activeStay = stays.find((s) => !s.end_date || s.end_date >= today) ?? stays[0];

  // Visa state
  const [showAddVisa, setShowAddVisa] = useState(false);
  const [editingVisaId, setEditingVisaId] = useState<number | null>(null);
  const [visaForm, setVisaForm] = useState<VisaForm>(EMPTY_VISA);
  const [savingVisa, setSavingVisa] = useState(false);

  const openAddVisa = () => { setEditingVisaId(null); setVisaForm(EMPTY_VISA); setShowAddVisa(true); };
  const openEditVisa = (v: Visa) => { setShowAddVisa(false); setEditingVisaId(v.id); setVisaForm({ visa_type: v.visa_type ?? "DN1", entry_date: v.entry_date ?? "", expiry_date: v.expiry_date ?? "", notes: v.notes ?? "" }); };
  const cancelVisa = () => { setShowAddVisa(false); setEditingVisaId(null); setVisaForm(EMPTY_VISA); };

  const submitVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStay) return alert("Chưa có đợt lưu trú.");
    setSavingVisa(true);
    try {
      const p = { visa_type: visaForm.visa_type || null, entry_date: visaForm.entry_date || null, expiry_date: visaForm.expiry_date || null, notes: visaForm.notes || null };
      if (editingVisaId) await updateVisa(editingVisaId, p);
      else await createVisa(activeStay.id, p);
      cancelVisa(); onRefresh();
    } catch { alert("Lỗi khi lưu Visa."); } finally { setSavingVisa(false); }
  };

  const deleteV = async (id: number) => {
    if (!window.confirm("Xóa Visa này?")) return;
    await deleteVisa(id); onRefresh();
  };

  // TamTru state
  const [showAddTT, setShowAddTT] = useState(false);
  const [editingTTId, setEditingTTId] = useState<number | null>(null);
  const [ttForm, setTtForm] = useState<TamTruForm>(EMPTY_TAMTRU);
  const [savingTT, setSavingTT] = useState(false);

  const openAddTT = () => { setEditingTTId(null); setTtForm(EMPTY_TAMTRU); setShowAddTT(true); };
  const openEditTT = (tt: TamTru) => { setShowAddTT(false); setEditingTTId(tt.id); setTtForm({ registration_date: tt.registration_date ?? "", expiry_date: tt.expiry_date ?? "", notes: tt.notes ?? "" }); };
  const cancelTT = () => { setShowAddTT(false); setEditingTTId(null); setTtForm(EMPTY_TAMTRU); };

  const submitTT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStay) return alert("Chưa có đợt lưu trú.");
    setSavingTT(true);
    try {
      const p = { registration_date: ttForm.registration_date || null, expiry_date: ttForm.expiry_date || null, notes: ttForm.notes || null };
      if (editingTTId) await updateTamTru(editingTTId, p);
      else await createTamTru(activeStay.id, p);
      cancelTT(); onRefresh();
    } catch { alert("Lỗi khi lưu Tạm trú."); } finally { setSavingTT(false); }
  };

  const deleteTT = async (id: number) => {
    if (!window.confirm("Xóa bản ghi Tạm trú này?")) return;
    await deleteTamTru(id); onRefresh();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800">Visa & Đăng ký Tạm trú</h3>
        <p className="text-xs text-slate-500 mt-0.5">Theo dõi lịch sử cấp Visa và đăng ký tạm trú</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VISA COLUMN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Visa ({visas.length})
            </h4>
            <button onClick={showAddVisa ? cancelVisa : openAddVisa}
              className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded border border-blue-200 cursor-pointer transition-colors">
              {showAddVisa ? "Huỷ" : "+ Thêm Visa"}
            </button>
          </div>

          {showAddVisa && (
            <div className="rounded-lg overflow-hidden border border-blue-200">
              <VisaInlineForm form={visaForm} onChange={setVisaForm} onSubmit={submitVisa} onCancel={cancelVisa} saving={savingVisa} isEdit={false} />
            </div>
          )}

          <div className="space-y-2">
            {visas.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Chưa có bản ghi Visa nào.</p>
            ) : (
              visas.map((v) => {
                const isEditing = editingVisaId === v.id;
                return (
                  <div key={v.id}>
                    <div className={`p-3 rounded-lg border transition-all ${isEditing ? "border-blue-400 bg-blue-50/40 rounded-b-none" : "bg-white border-slate-200"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800">Visa {v.visa_type}</span>
                            <ExpiryBadge dateStr={v.expiry_date} />
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {formatDate(v.entry_date)} <span className="text-slate-300 mx-1">→</span> <span className="font-semibold text-slate-700">{formatDate(v.expiry_date)}</span>
                          </div>
                          {v.notes && <div className="text-xs text-slate-400 italic">{v.notes}</div>}
                          <div className="text-[10px] text-slate-300">Stay #{v.stay_id}</div>
                        </div>
                        <div className="flex gap-2 text-xs shrink-0">
                          <button onClick={() => isEditing ? cancelVisa() : openEditVisa(v)} className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">{isEditing ? "Đóng" : "Sửa"}</button>
                          <button onClick={() => deleteV(v.id)} className="text-red-500 hover:text-red-700 font-medium cursor-pointer">Xóa</button>
                        </div>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="border border-t-0 border-blue-400 rounded-b-lg overflow-hidden">
                        <VisaInlineForm form={visaForm} onChange={setVisaForm} onSubmit={submitVisa} onCancel={cancelVisa} saving={savingVisa} isEdit={true} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* TAM TRU COLUMN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Đăng ký Tạm trú ({tamTrus.length})
            </h4>
            <button onClick={showAddTT ? cancelTT : openAddTT}
              className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded border border-emerald-200 cursor-pointer transition-colors">
              {showAddTT ? "Huỷ" : "+ Thêm Tạm trú"}
            </button>
          </div>

          {showAddTT && (
            <div className="rounded-lg overflow-hidden border border-emerald-200">
              <TamTruInlineForm form={ttForm} onChange={setTtForm} onSubmit={submitTT} onCancel={cancelTT} saving={savingTT} isEdit={false} />
            </div>
          )}

          <div className="space-y-2">
            {tamTrus.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Chưa có bản ghi Tạm trú nào.</p>
            ) : (
              tamTrus.map((tt) => {
                const isEditing = editingTTId === tt.id;
                return (
                  <div key={tt.id}>
                    <div className={`p-3 rounded-lg border transition-all ${isEditing ? "border-emerald-400 bg-emerald-50/40 rounded-b-none" : "bg-white border-slate-200"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800">Đăng ký Tạm trú</span>
                            <ExpiryBadge dateStr={tt.expiry_date} />
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            Khai báo: <span className="font-medium text-slate-700">{formatDate(tt.registration_date)}</span>
                            <span className="text-slate-300 mx-1">→</span>
                            Hết hạn: <span className="font-semibold text-slate-700">{formatDate(tt.expiry_date)}</span>
                          </div>
                          {tt.notes && <div className="text-xs text-slate-400 italic">{tt.notes}</div>}
                        </div>
                        <div className="flex gap-2 text-xs shrink-0">
                          <button onClick={() => isEditing ? cancelTT() : openEditTT(tt)} className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer">{isEditing ? "Đóng" : "Sửa"}</button>
                          <button onClick={() => deleteTT(tt.id)} className="text-red-500 hover:text-red-700 font-medium cursor-pointer">Xóa</button>
                        </div>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="border border-t-0 border-emerald-400 rounded-b-lg overflow-hidden">
                        <TamTruInlineForm form={ttForm} onChange={setTtForm} onSubmit={submitTT} onCancel={cancelTT} saving={savingTT} isEdit={true} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface StayVisaTamTruSectionProps {
  stay: Stay;
}

export const StayVisaTamTruSection: React.FC<StayVisaTamTruSectionProps> = ({ stay }) => {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [tamTrus, setTamTrus] = useState<TamTru[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vData, tData] = await Promise.all([
        fetchVisas(stay.id),
        fetchTamTrus(stay.id),
      ]);
      setVisas(vData);
      setTamTrus(tData);
    } catch (err) {
      console.error("Failed to load visa/tamtru for stay:", err);
    } finally {
      setLoading(false);
    }
  }, [stay.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="text-xs text-slate-400 p-4">Đang tải thông tin Visa & Tạm trú...</div>;
  }

  return (
    <VisaTamTruSection
      stays={[stay]}
      visas={visas}
      tamTrus={tamTrus}
      onRefresh={loadData}
    />
  );
};

