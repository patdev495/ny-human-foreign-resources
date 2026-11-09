import { useEffect, useState } from "react";
import { calculateCost, fetchProviders, fetchVendorRoutes } from "../api";
import type { CalculateCostResponse, VehicleProvider, VendorRoute } from "../types";
import { PdfViewerModal } from "./PdfViewerModal";
import { systemField, systemSecondaryButton } from "../../../shared/components/systemStyles";

export function VendorRouteManagement() {
  const [providers, setProviders] = useState<VehicleProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [providerLoading, setProviderLoading] = useState(true);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<VendorRoute[]>([]);
  const [rates, setRates] = useState<CalculateCostResponse | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPurpose, setFilterPurpose] = useState("ALL");
  const [providerRetry, setProviderRetry] = useState(0);
  const [routeRetry, setRouteRetry] = useState(0);
  const [pdfOpen, setPdfOpen] = useState(false);
  useEffect(() => {
    let active = true;
    setProviderLoading(true);
    setProviderError(null);
    fetchProviders().then(data => {
      if (!active) return;
      const outsourced = data.filter(provider => provider.provider_type === "OUTSOURCED");
      setProviders(outsourced);
      setSelectedProviderId(previous => outsourced.some(provider => provider.id === previous) ? previous : (outsourced.find(provider => provider.name === "Bình An") || outsourced[0])?.id ?? null);
    }).catch((failure: unknown) => { if (active) setProviderError(failure instanceof Error ? failure.message : "Không tải được danh sách nhà xe."); })
      .finally(() => { if (active) setProviderLoading(false); });
    return () => { active = false; };
  }, [providerRetry]);

  useEffect(() => {
    let active = true;
    setRoutes([]);
    setRates(null);
    setRatesError(null);
    setError(null);
    if (selectedProviderId === null) { setLoading(false); return; }
    setLoading(true);
    Promise.allSettled([fetchVendorRoutes(selectedProviderId), calculateCost({ provider_id: selectedProviderId, route_type: "KM_BASED", distance_km: 1, waiting_hours: 1 })]).then(([routeResult, rateResult]) => {
      if (!active) return;
      if (routeResult.status === "fulfilled") setRoutes(routeResult.value);
      else { const failure: unknown = routeResult.reason; setError(failure instanceof Error ? failure.message : "Không tải được bảng giá tuyến đường."); }
      if (rateResult.status === "fulfilled") setRates(rateResult.value);
      else setRatesError("Chưa tải được đơn giá theo km và giờ chờ. Có thể thử tải lại.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [selectedProviderId, routeRetry]);

  const currentProvider = providers.find(provider => provider.id === selectedProviderId);
  const purposes = [...new Set(routes.map(route => route.purpose || "Chung"))];
  const filtered = routes.filter(route => filterPurpose === "ALL" || (route.purpose || "Chung") === filterPurpose);
  const busy = loading || providerLoading;
  const canViewPdf = currentProvider?.name.trim().toLocaleLowerCase("vi-VN") === "bình an";
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-3 rounded-sm border border-slate-200 bg-white p-4">
      <label className="w-full text-sm text-slate-700 sm:w-64"><span className="mb-1 block">Nhà xe</span>
        <select value={selectedProviderId ?? ""} disabled={providerLoading || !!providerError} onChange={event => { setFilterPurpose("ALL"); setSelectedProviderId(event.target.value ? Number(event.target.value) : null); }} className={systemField}>
          {providers.length === 0 && <option value="">{providerLoading ? "Đang tải nhà xe…" : "Chưa có nhà xe thuê ngoài"}</option>}
          {providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}{provider.phone ? ` · ${provider.phone}` : ""}</option>)}
        </select>
      </label>
      <label className="w-full text-sm text-slate-700 sm:w-64"><span className="mb-1 block">Mục đích sử dụng</span>
        <select value={filterPurpose} disabled={busy || !!error || !!providerError} onChange={event => setFilterPurpose(event.target.value)} className={systemField}>
          <option value="ALL">Tất cả mục đích</option>{purposes.map(purpose => <option key={purpose} value={purpose}>{purpose} ({routes.filter(route => (route.purpose || "Chung") === purpose).length})</option>)}
        </select>
      </label>
      {canViewPdf && <button type="button" onClick={() => setPdfOpen(true)} disabled={providerLoading} className={systemSecondaryButton}>Xem PDF hợp đồng</button>}
    </div>
    {busy && <p role="status" className="py-6 text-sm text-slate-500">Đang tải bảng giá tuyến đường…</p>}
    {providerError && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700"><span>{providerError}</span><button type="button" onClick={() => setProviderRetry(value => value + 1)} className={systemSecondaryButton}>Thử lại</button></div>}
    {!busy && !providerError && error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => setRouteRetry(value => value + 1)} className={systemSecondaryButton}>Thử lại</button></div>}
    {!busy && !error && !providerError && <>
      {currentProvider && <div className="space-y-2 text-sm text-slate-600">
        <p><strong className="font-semibold text-slate-900">{currentProvider.name}</strong>{currentProvider.notes ? ` · ${currentProvider.notes}` : ""}</p>
        {rates && <p>Đơn giá chạy theo km: {rates.base_cost.toLocaleString("vi-VN")} đ/km · Chờ khi chạy theo km: {rates.waiting_cost.toLocaleString("vi-VN")} đ/giờ. Phí chờ tuyến cố định ghi theo từng dòng bên dưới.</p>}
        {ratesError && <div role="alert" className="text-amber-800">{ratesError} <button type="button" onClick={() => setRouteRetry(value => value + 1)} className={systemSecondaryButton}>Tải lại đơn giá</button></div>}
      </div>}
      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
        <div role="region" aria-label="Bảng giá tuyến đường nhà xe" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50"><tr>{["STT", "Mục đích", "Lộ trình", "Loại xe", "Cước (đ)", "Phí chờ (đ/giờ)", "Chiều về", "Ghi chú"].map((title, index) => <th key={title} scope="col" className={`px-4 py-3 font-medium ${index === 4 || index === 5 ? "text-right" : ""}`}>{title}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">{providers.length === 0 ? "Chưa có nhà xe thuê ngoài." : "Không có tuyến đường phù hợp."}</td></tr>}
              {filtered.map((route, index) => <tr key={route.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3 tabular-nums text-slate-500">{index + 1}</td><td className="px-4 py-3">{route.purpose || "Chung"}</td>
                <td className="min-w-56 px-4 py-3"><div>{route.pickup_location}</div><div className="mt-1">→ {route.dropoff_location}</div></td>
                <td className="whitespace-nowrap px-4 py-3">{route.seat_type}</td><td className="px-4 py-3 text-right tabular-nums">{route.fixed_price.toLocaleString("vi-VN")}</td><td className="px-4 py-3 text-right tabular-nums">{route.waiting_fee_per_hour.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3">{route.is_two_way_same_price ? "Ngược lại đồng giá" : "Một chiều"}</td><td className="min-w-36 max-w-60 whitespace-pre-wrap break-words px-4 py-3 text-slate-500">{route.notes || "—"}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">Hiển thị {filtered.length} / {routes.length} tuyến đường</p>
      </div>
    </>}
    <PdfViewerModal isOpen={pdfOpen && canViewPdf} title={`Hợp đồng nhà xe ${currentProvider?.name || ""}`} docKey="binh_an" onClose={() => setPdfOpen(false)} />
  </div>;
}
