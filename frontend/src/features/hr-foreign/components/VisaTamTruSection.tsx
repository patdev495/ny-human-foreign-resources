import React, { useState, useEffect } from "react";
import type { Stay, TamTru, Visa } from "../types";
import {
  fetchVisas,
  createVisa,
  deleteVisa,
  fetchTamTrus,
  createTamTru,
  deleteTamTru,
} from "../api";

interface VisaTamTruSectionProps {
  stay: Stay;
}

export const VisaTamTruSection: React.FC<VisaTamTruSectionProps> = ({ stay }) => {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [tamTrus, setTamTrus] = useState<TamTru[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [visaType, setVisaType] = useState("DN1");
  const [visaEntry, setVisaEntry] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [visaNotes, setVisaNotes] = useState("");

  const [ttReg, setTtReg] = useState("");
  const [ttExpiry, setTtExpiry] = useState("");
  const [ttNotes, setTtNotes] = useState("");

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [vData, ttData] = await Promise.all([
        fetchVisas(stay.id),
        fetchTamTrus(stay.id),
      ]);
      setVisas(vData);
      setTamTrus(ttData);
    } catch (err) {
      console.error("Failed to load visas/tam trus:", err);
    } finally {
      setLoading(false);
    }
  }, [stay.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visaEntry || !visaExpiry) return;
    try {
      await createVisa(stay.id, {
        visa_type: visaType,
        entry_date: visaEntry,
        expiry_date: visaExpiry,
        notes: visaNotes || null,
      });
      setVisaEntry("");
      setVisaExpiry("");
      setVisaNotes("");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi thêm Visa.");
    }
  };

  const handleAddTamTru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttReg || !ttExpiry) return;
    try {
      await createTamTru(stay.id, {
        registration_date: ttReg,
        expiry_date: ttExpiry,
        notes: ttNotes || null,
      });
      setTtReg("");
      setTtExpiry("");
      setTtNotes("");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi thêm Đăng ký tạm trú.");
    }
  };

  const handleDeleteVisa = async (id: number) => {
    if (!window.confirm("Xóa bản ghi Visa này?")) return;
    await deleteVisa(id);
    loadData();
  };

  const handleDeleteTamTru = async (id: number) => {
    if (!window.confirm("Xóa bản ghi Tạm trú này?")) return;
    await deleteTamTru(id);
    loadData();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-lg font-bold text-slate-800">
          Lịch sử Giấy tờ (Visa & Tạm trú) — Stay #{stay.id}
        </h3>
        <p className="text-xs text-slate-500">
          Ghi nhận quá trình cấp mới & gia hạn Visa, Đăng ký tạm trú trong chuyến làm việc tại Việt Nam
        </p>
      </div>

      {loading ? (
        <div className="py-6 text-center text-slate-400">Đang tải giấy tờ...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VISAS COLUMN */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Lịch sử Visa ({visas.length})
              </h4>
            </div>

            <form onSubmit={handleAddVisa} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="font-medium text-slate-700">Thêm lượt gia hạn / cấp Visa mới</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Loại Visa</label>
                  <input
                    type="text"
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    placeholder="VD: DN1, LĐ2"
                    className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Ngày nhập cảnh</label>
                  <input
                    type="date"
                    value={visaEntry}
                    onChange={(e) => setVisaEntry(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={visaExpiry}
                    onChange={(e) => setVisaExpiry(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={visaNotes}
                  onChange={(e) => setVisaNotes(e.target.value)}
                  placeholder="Ghi chú (tùy chọn)"
                  className="flex-1 p-1.5 border border-slate-300 rounded bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded cursor-pointer transition-colors"
                >
                  Thêm Visa
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {visas.map((v) => (
                <div key={v.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-800">
                      Visa {v.visa_type}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {v.entry_date} &rarr; <span className="font-semibold text-slate-700">{v.expiry_date}</span>
                    </div>
                    {v.notes && <div className="text-xs text-slate-400 mt-0.5">{v.notes}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteVisa(v.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* TAM TRU COLUMN */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Lịch sử Đăng ký Tạm trú ({tamTrus.length})
              </h4>
            </div>

            <form onSubmit={handleAddTamTru} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="font-medium text-slate-700">Thêm lượt đăng ký Tạm trú mới</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Ngày khai báo</label>
                  <input
                    type="date"
                    value={ttReg}
                    onChange={(e) => setTtReg(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Ngày hết hạn tạm trú</label>
                  <input
                    type="date"
                    value={ttExpiry}
                    onChange={(e) => setTtExpiry(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ttNotes}
                  onChange={(e) => setTtNotes(e.target.value)}
                  placeholder="Ghi chú (Cơ quan công an, số tờ khai...)"
                  className="flex-1 p-1.5 border border-slate-300 rounded bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded cursor-pointer transition-colors"
                >
                  Thêm Tạm Trú
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {tamTrus.map((tt) => (
                <div key={tt.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-800">
                      Đăng ký Tạm trú
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {tt.registration_date} &rarr; <span className="font-semibold text-slate-700">{tt.expiry_date}</span>
                    </div>
                    {tt.notes && <div className="text-xs text-slate-400 mt-0.5">{tt.notes}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteTamTru(tt.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
