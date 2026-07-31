import React, { useEffect, useState } from "react";
import { fetchMonthlyReconciliation } from "../api";
import type { MonthlyReconciliationItem } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyReconciliationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [billingMonth, setBillingMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [items, setItems] = useState<MonthlyReconciliationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!billingMonth) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMonthlyReconciliation(billingMonth);
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tính toán đối chiếu cước tháng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen, billingMonth]);

  if (!isOpen) return null;

  const grandTotal = items.reduce((sum, i) => sum + i.total_cost, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              Bảng Báo Cáo Đối Chiếu Cước Xe Thuê Tháng Đức Anh
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng hợp chi phí tiền khoán cố định, số km phụ trội và phụ phí theo chu kỳ (26 tháng trước đến 25 tháng này)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Chọn Chu Kỳ Tháng:
              </label>
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="border border-blue-300 rounded-lg text-sm px-3 py-1.5 bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Tổng Chi Phí Thanh Toán Trong Kỳ</span>
              <span className="text-2xl font-extrabold text-blue-700 font-mono">
                {grandTotal.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">Đang tính toán đối chiếu cước tháng...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Chưa tìm thấy hợp đồng xe khoán nào trong kỳ.</div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4">Xe / Hợp Đồng</th>
                    <th className="py-3 px-4 text-right">Giá Cố Định</th>
                    <th className="py-3 px-4 text-right">Tổng KM Tháng</th>
                    <th className="py-3 px-4 text-right">Hạn Mức</th>
                    <th className="py-3 px-4 text-right">Km Phụ Trội</th>
                    <th className="py-3 px-4 text-right">Tiền Km Phụ Trội</th>
                    <th className="py-3 px-4 text-right">Tổng Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item) => (
                    <tr key={item.vehicle_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.vehicle_name}</div>
                        <div className="text-xs text-blue-600 font-medium">{item.license_plate}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.contract_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                        {item.base_monthly_cost.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700">
                        {item.total_month_km.toLocaleString("vi-VN")} km
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {item.km_allowance.toLocaleString("vi-VN")} km
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-700">
                        {item.excess_km > 0 ? `${item.excess_km.toLocaleString("vi-VN")} km` : "0 km"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {item.excess_km_cost > 0
                          ? `${item.excess_km_cost.toLocaleString("vi-VN")} đ`
                          : "0 đ"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-blue-800 text-base">
                        {item.total_cost.toLocaleString("vi-VN")} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-right text-slate-700 uppercase text-xs">
                      TỔNG CỘNG TIỀN THUÊ XE THÁNG ĐỨC ANH:
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-lg text-blue-900">
                      {grandTotal.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            * Đối chiếu số liệu chính thức với Bên cho thuê Vận tải Đức Anh
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
