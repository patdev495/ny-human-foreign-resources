import { useEffect, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, FileText, Route, Zap } from "lucide-react";
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700"><Route className="h-6 w-6" aria-hidden="true" /></span>
        <div><h2 className="text-base font-bold text-slate-900">Bảng giá tuyến đường</h2><p className="mt-1 text-xs text-slate-500">Đơn giá chuyến, loại xe và phụ phí theo hợp đồng nhà xe</p></div>
      </header>
      <div className="flex flex-wrap items-end gap-3 p-4 sm:p-5">
      <label className="w-full text-sm text-slate-700 sm:w-64"><span className="mb-1 block font-medium">Nhà xe</span>
        <select value={selectedProviderId ?? ""} disabled={providerLoading || !!providerError} onChange={event => { setFilterPurpose("ALL"); setSelectedProviderId(event.target.value ? Number(event.target.value) : null); }} className={systemField}>
          {providers.length === 0 && <option value="">{providerLoading ? "Đang tải nhà xe…" : "Chưa có nhà xe thuê ngoài"}</option>}
          {providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}{provider.phone ? ` · ${provider.phone}` : ""}</option>)}
        </select>
      </label>
      <label className="w-full text-sm text-slate-700 sm:w-64"><span className="mb-1 block font-medium">Mục đích sử dụng</span>
        <select value={filterPurpose} disabled={busy || !!error || !!providerError} onChange={event => setFilterPurpose(event.target.value)} className={systemField}>
          <option value="ALL">Tất cả mục đích</option>{purposes.map(purpose => <option key={purpose} value={purpose}>{purpose} ({routes.filter(route => (route.purpose || "Chung") === purpose).length})</option>)}
        </select>
      </label>
      {canViewPdf && <button type="button" onClick={() => setPdfOpen(true)} disabled={providerLoading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"><FileText className="h-4 w-4" aria-hidden="true" />Xem PDF hợp đồng</button>}
      </div>
    </section>
    {busy && <p role="status" className="py-6 text-sm text-slate-500">Đang tải bảng giá tuyến đường…</p>}
    {providerError && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700"><span>{providerError}</span><button type="button" onClick={() => setProviderRetry(value => value + 1)} className={systemSecondaryButton}>Thử lại</button></div>}
    {!busy && !providerError && error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => setRouteRetry(value => value + 1)} className={systemSecondaryButton}>Thử lại</button></div>}
    {!busy && !error && !providerError && <>
      {currentProvider && <section className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 sm:p-5" aria-label="Đơn giá theo km và giờ chờ">
        <div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" /><div><h3 className="text-sm font-bold text-indigo-950">Hợp đồng đối tác: {currentProvider.name}</h3>{currentProvider.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{currentProvider.notes}</p>}</div></div>
        {rates && <>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-indigo-100 bg-white p-4"><dt className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><Zap className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />Đơn giá chạy theo km</dt><dd className="mt-2 text-xl font-bold tabular-nums text-indigo-800">{rates.base_cost.toLocaleString("vi-VN")} <span className="text-xs font-medium">đ/km</span></dd></div>
            <div className="rounded-xl border border-indigo-100 bg-white p-4"><dt className="text-xs font-medium text-slate-600">Phí chờ khi chạy theo km</dt><dd className="mt-2 text-xl font-bold tabular-nums text-indigo-800">{rates.waiting_cost.toLocaleString("vi-VN")} <span className="text-xs font-medium">đ/giờ</span></dd></div>
          </dl>
          <p className="text-xs text-indigo-900">Phí chờ của tuyến cố định được ghi riêng theo từng dòng trong bảng giá.</p>
        </>}
        {ratesError && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{ratesError} <button type="button" onClick={() => setRouteRetry(value => value + 1)} className={systemSecondaryButton}>Tải lại đơn giá</button></div>}
      </section>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div role="region" aria-label="Bảng giá tuyến đường nhà xe" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50"><tr>{["STT", "Mục đích", "Lộ trình", "Loại xe", "Cước (đ)", "Phí chờ (đ/giờ)", "Chiều về", "Ghi chú"].map((title, index) => <th key={title} scope="col" className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 ${index === 4 || index === 5 ? "text-right" : ""}`}>{title}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">{providers.length === 0 ? "Chưa có nhà xe thuê ngoài." : "Không có tuyến đường phù hợp."}</td></tr>}
              {filtered.map((route, index) => <tr key={route.id} className="align-top transition-colors hover:bg-indigo-50/30">
                <td className="px-4 py-4 tabular-nums text-slate-400">{index + 1}</td><td className="px-4 py-4"><span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{route.purpose || "Chung"}</span></td>
                <td className="min-w-56 px-4 py-4"><div className="font-semibold text-emerald-700">{route.pickup_location}</div><div className="mt-1 flex items-start gap-1.5 font-semibold text-indigo-700"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />{route.dropoff_location}</div></td>
                <td className="whitespace-nowrap px-4 py-4"><span className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">{route.seat_type}</span></td><td className="px-4 py-4 text-right font-bold tabular-nums text-emerald-700">{route.fixed_price.toLocaleString("vi-VN")}</td><td className="px-4 py-4 text-right tabular-nums text-slate-700">{route.waiting_fee_per_hour.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-4">{route.is_two_way_same_price ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />Ngược lại đồng giá</span> : <span className="text-xs text-slate-500">Một chiều</span>}</td><td className="min-w-36 max-w-60 whitespace-pre-wrap break-words px-4 py-4 text-xs text-slate-500">{route.notes || "—"}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <p role="status" className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-medium text-slate-500">Hiển thị {filtered.length} / {routes.length} tuyến đường</p>
      </div>
    </>}
    <PdfViewerModal isOpen={pdfOpen && canViewPdf} title={`Hợp đồng nhà xe ${currentProvider?.name || ""}`} docKey="binh_an" onClose={() => setPdfOpen(false)} />
  </div>;
}
