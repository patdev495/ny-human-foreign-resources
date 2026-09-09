import React, { useEffect, useState } from "react";
import {
  Car,
  FileText,
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
  Filter,
} from "lucide-react";
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
      <div className="executive-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Đối tác vận tải:</span>
          </span>
          {Array.from(
            new Map(
              providers
                .filter((p) => p.provider_type === "OUTSOURCED")
                .map((p) => [p.name, p])
            ).values()
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProviderId(p.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedProviderId === p.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>{p.name} {p.phone ? `(${p.phone})` : ""}</span>
            </button>
          ))}
        </div>

        {/* Filter by purpose & PDF Viewer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterPurpose}
              onChange={(e) => setFilterPurpose(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">Tất cả mục đích ({routes.length} tuyến)</option>
              {purposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenPdf}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-200/80"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600" />
            <span>Xem PDF Hợp Đồng</span>
          </button>
        </div>
      </div>

      {currentProvider && (
        <div className="bg-indigo-50/70 border border-indigo-100/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-indigo-950 text-sm">Hợp đồng Đối tác: {currentProvider.name}</span>
            {currentProvider.notes && (
              <span className="text-slate-600 ml-2 block sm:inline">— {currentProvider.notes}</span>
            )}
          </div>
          <div className="text-indigo-900 font-semibold bg-white/90 px-3.5 py-1.5 rounded-lg border border-indigo-200/60 shadow-2xs flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              Phụ phí chờ: <span className="font-bold mono-metric text-indigo-950">30.000 đ/giờ</span> | Giá KM ngoài HĐ:{" "}
              <span className="font-bold mono-metric text-indigo-950">14.000 đ/km</span>
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Routes Table */}
      <div className="executive-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3.5 w-12 text-center" scope="col">STT</th>
                <th className="p-3.5" scope="col">Hạng mục sử dụng</th>
                <th className="p-3.5" scope="col">Lộ trình Tuyến đường</th>
                <th className="p-3.5 text-center" scope="col">Loại xe</th>
                <th className="p-3.5 text-right" scope="col">Cước phí hợp đồng</th>
                <th className="p-3.5 text-center" scope="col">Khứ hồi</th>
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
                    <td className="p-3.5 text-center text-slate-400 mono-metric font-medium">{idx + 1}</td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {r.purpose || "Chung"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <span className="text-emerald-700 font-semibold">{r.pickup_location}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="text-indigo-700 font-semibold">{r.dropoff_location}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg mono-metric">
                        {r.seat_type}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-700 mono-metric text-sm">
                      {r.fixed_price.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="p-3.5 text-center text-[11px] font-medium text-slate-500">
                      {r.is_two_way_same_price ? (
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 border border-emerald-200/80">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Ngược lại đồng giá</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
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
