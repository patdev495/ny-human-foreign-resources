import React, { useEffect, useState } from "react";
import { fetchProviders, fetchVendorRoutes } from "../api";
import type { VehicleProvider, VendorRoute } from "../types";

interface VendorRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VendorRouteModal: React.FC<VendorRouteModalProps> = ({ isOpen, onClose }) => {
  const [providers, setProviders] = useState<VehicleProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [routes, setRoutes] = useState<VendorRoute[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterPurpose, setFilterPurpose] = useState<string>("ALL");

  useEffect(() => {
    if (!isOpen) return;
    fetchProviders().then((data) => {
      setProviders(data);
      const binhAn = data.find((p) => p.name === "Bình An") || data[0];
      if (binhAn) {
        setSelectedProviderId(binhAn.id);
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (!selectedProviderId) return;
    setLoading(true);
    fetchVendorRoutes(selectedProviderId)
      .then((data) => setRoutes(data))
      .catch((err) => console.error("Lỗi khi tải bảng giá hợp đồng:", err))
      .finally(() => setLoading(false));
  }, [selectedProviderId]);

  if (!isOpen) return null;

  const currentProvider = providers.find((p) => p.id === selectedProviderId);
  const purposes = Array.from(new Set(routes.map((r) => r.purpose || "Chung"))).filter(Boolean);

  const filteredRoutes = routes.filter((r) => {
    if (filterPurpose === "ALL") return true;
    return (r.purpose || "Chung") === filterPurpose;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>📋</span> Bảng Giá Hợp Đồng Xe Thuê Ngoài
            </h3>
            <p className="text-xs text-slate-500">
              Danh mục tuyến đường & đơn giá theo Hợp đồng cung cấp dịch vụ vận tải
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Provider Selector Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto shrink-0 pt-1 pb-2">
          {Array.from(
            new Map(
              providers
                .filter((p) => p.provider_type === "OUTSOURCED")
                .map((p) => [p.name, p])
            ).values()
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProviderId(p.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                selectedProviderId === p.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              🚕 {p.name} {p.phone ? `(${p.phone})` : ""}
            </button>
          ))}
        </div>

        {currentProvider && (
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-blue-900">{currentProvider.name}</span>
              {currentProvider.notes && (
                <span className="text-slate-600 ml-2">— {currentProvider.notes}</span>
              )}
            </div>
            <div className="text-blue-800 font-medium">
              ⚡ Thời gian chờ: <span className="font-bold">30.000 đ/giờ</span> | Giá KM ngoài HĐ:{" "}
              <span className="font-bold">14.000 đ/km</span>
            </div>
          </div>
        )}

        {/* Filter by purpose */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-600">Lọc theo hạng mục:</span>
          <select
            value={filterPurpose}
            onChange={(e) => setFilterPurpose(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Tất cả hạng mục ({routes.length} tuyến)</option>
            {purposes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Routes Table */}
        <div className="flex-1 overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">STT</th>
                <th className="p-3">Hạng mục dùng xe</th>
                <th className="p-3">Điểm đi ➔ Điểm đến (Tuyến đường)</th>
                <th className="p-3 text-center">Loại xe</th>
                <th className="p-3 text-right">Giá cố định hợp đồng</th>
                <th className="p-3 text-center">Chiều về (Khứ hồi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Đang tải bảng giá hợp đồng...
                  </td>
                </tr>
              ) : filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    Chưa có bảng giá cho nhà xe này.
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.purpose || "Chung"}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">
                        <span className="text-emerald-700">{r.pickup_location}</span>
                        <span className="mx-1.5 text-slate-400">➔</span>
                        <span className="text-blue-700">{r.dropoff_location}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                        {r.seat_type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700 text-sm">
                      {r.fixed_price.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-3 text-center text-[11px] font-medium text-slate-500">
                      {r.is_two_way_same_price ? (
                        <span className="text-emerald-600 font-bold">✔ Ngược lại đồng giá</span>
                      ) : (
                        "Một chiều"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
