import React, { useState, useEffect } from "react";
import type { ExpiringDocumentsResponse } from "../types";
import { fetchExpiringDocuments } from "../api";

export const ExpiringDocsAlert: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ExpiringDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (warningDays: number) => {
    try {
      setLoading(true);
      const res = await fetchExpiringDocuments(warningDays);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch expiring docs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(days);
  }, [days]);

  const totalExpiring =
    (data?.expiring_visas.length || 0) + (data?.expiring_tam_trus.length || 0);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Cảnh báo Giấy tờ sắp Hết hạn (Visa / Tạm trú)
            {totalExpiring > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {totalExpiring} cần lưu ý
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500">
            Hỗ trợ bộ phận HR chủ động làm thủ tục gia hạn giấy tờ pháp lý cho nhân sự nước ngoài
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium whitespace-nowrap">Khung cảnh báo:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
          >
            <option value={15}>Trong vòng 15 ngày</option>
            <option value={30}>Trong vòng 30 ngày</option>
            <option value={60}>Trong vòng 60 ngày</option>
            <option value={90}>Trong vòng 90 ngày</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400">Đang kiểm tra danh sách hết hạn...</div>
      ) : totalExpiring === 0 ? (
        <div className="py-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100 text-emerald-700 text-sm font-medium">
           Tất cả Visa và Tạm trú của nhân sự đều còn hạn dài trong vòng {days} ngày tới.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EXPIRING VISAS */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center justify-between">
              <span>Visa sắp hết hạn ({data?.expiring_visas.length})</span>
            </h3>
            {data?.expiring_visas.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Không có Visa nào sắp hết hạn.</p>
            ) : (
              data?.expiring_visas.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {item.employee_name} {item.passport_number ? `(${item.passport_number})` : ""}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Visa loại: <span className="font-semibold">{item.type_name}</span> &bull; Ngày hết hạn:{" "}
                      <span className="font-mono font-semibold text-amber-900">{item.expiry_date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-lg">
                      Còn {item.days_remaining} ngày
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* EXPIRING TAM TRUS */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center justify-between">
              <span>Đăng ký Tạm trú sắp hết hạn ({data?.expiring_tam_trus.length})</span>
            </h3>
            {data?.expiring_tam_trus.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Không có Đăng ký tạm trú nào sắp hết hạn.</p>
            ) : (
              data?.expiring_tam_trus.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {item.employee_name} {item.passport_number ? `(${item.passport_number})` : ""}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Giấy tờ: <span className="font-semibold">{item.type_name}</span> &bull; Ngày hết hạn:{" "}
                      <span className="font-mono font-semibold text-rose-900">{item.expiry_date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-lg">
                      Còn {item.days_remaining} ngày
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
