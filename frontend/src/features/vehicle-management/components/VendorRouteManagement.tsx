import React, { useEffect, useState } from "react";
import { fetchProviders, fetchVendorRoutes } from "../api";
import type { VehicleProvider, VendorRoute } from "../types";
import { PdfViewerModal } from "./PdfViewerModal";

export const VendorRouteManagement: React.FC = () => {
  const [providers, setProviders] = useState<VehicleProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [routes, setRoutes] = useState<VendorRoute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPurpose, setFilterPurpose] = useState<string>("ALL");

  // PDF Viewer Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);
  const [pdfTitle, setPdfTitle] = useState<string>("");
  const [pdfDocKey, setPdfDocKey] = useState<string | null>(null);

  const handleOpenPdf = () => {
    const providerName = currentProvider ? currentProvider.name : "Bình An";
    setPdfDocKey("binh_an");
    setPdfTitle(`Hợp Đồng Nhà Xe ${providerName}`);
    setPdfModalOpen(true);
  };

  useEffect(() => {
    fetchProviders()
      .then((data) => {
        setProviders(data);
        const binhAn = data.find((p) => p.name === "Bình An") || data.find((p) => p.provider_type === "OUTSOURCED") || data[0];
        if (binhAn) {
          setSelectedProviderId(binhAn.id);
        }
      })
      .catch((err) => setError(err.message || "Lỗi khi tải danh sách nhà xe"));
  }, []);

  useEffect(() => {
    if (!selectedProviderId) return;
    setLoading(true);
    setError(null);
    fetchVendorRoutes(selectedProviderId)
      .then((data) => setRoutes(data))
      .catch((err) => setError(err.message || "Lỗi khi tải bảng giá hợp đồng tuyến đường"))
      .finally(() => setLoading(false));
  }, [selectedProviderId]);

  const currentProvider = providers.find((p) => p.id === selectedProviderId);
  const purposes = Array.from(new Set(routes.map((r) => r.purpose || "Chung"))).filter(Boolean);

  const filteredRoutes = routes.filter((r) => {
    if (filterPurpose === "ALL") return true;
    return (r.purpose || "Chung") === filterPurpose;
  });

  return (
    <div className="space-y-6">
      {/* Provider Selector Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhà xe ngoài:</span>
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

        {/* Filter by purpose & PDF Viewer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Hạng mục:</span>
            <select
              value={filterPurpose}
              onChange={(e) => setFilterPurpose(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">Tất cả ({routes.length} tuyến)</option>
              {purposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenPdf}
            className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>📄</span> Xem File HĐ PDF
          </button>
        </div>
      </div>

      {currentProvider && (
        <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-blue-900 text-sm">Hợp đồng Nhà xe: {currentProvider.name}</span>
            {currentProvider.notes && (
              <span className="text-slate-600 ml-2 block sm:inline">— {currentProvider.notes}</span>
            )}
          </div>
          <div className="text-blue-800 font-semibold bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200/60 shadow-2xs">
            ⚡ Phụ phí chờ: <span className="font-bold text-blue-900">30.000 đ/giờ</span> | Giá KM ngoài HĐ:{" "}
            <span className="font-bold text-blue-900">14.000 đ/km</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Routes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-12 text-center">STT</th>
                <th className="p-3.5">Hạng mục dùng xe</th>
                <th className="p-3.5">Điểm đi ➔ Điểm đến (Tuyến đường)</th>
                <th className="p-3.5 text-center">Loại xe</th>
                <th className="p-3.5 text-right">Giá cố định hợp đồng</th>
                <th className="p-3.5 text-center">Chiều về (Khứ hồi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    Đang tải bảng giá hợp đồng tuyến đường...
                  </td>
                </tr>
              ) : filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    Chưa có bảng giá cho nhà xe này.
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{r.purpose || "Chung"}</td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-900">
                        <span className="text-emerald-700 font-semibold">{r.pickup_location}</span>
                        <span className="mx-2 text-slate-400">➔</span>
                        <span className="text-blue-700 font-semibold">{r.dropoff_location}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                        {r.seat_type}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-700 text-sm">
                      {r.fixed_price.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-3.5 text-center text-[11px] font-medium text-slate-500">
                      {r.is_two_way_same_price ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          ✔ Ngược lại đồng giá
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Một chiều
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModalOpen}
        title={pdfTitle}
        docKey={pdfDocKey}
        onClose={() => setPdfModalOpen(false)}
      />
    </div>
  );
};
