import { useState, useEffect, useCallback } from "react";
import type { EventDay, MealPriceConfig, Stay, ForeignEmployee } from "../types";
import { fetchEventDays, fetchMealPriceConfigs, fetchStays, fetchEmployees } from "../api";
import { EventSettingsTab } from "./meal-config/EventSettingsTab";
import { MealPriceConfigTab } from "./meal-config/MealPriceConfigTab";
import { MealAbsencesTab } from "./meal-config/MealAbsencesTab";
import { SystemTabs } from "../../../shared/components/SystemTabs";
import { systemSecondaryButton } from "../../../shared/components/systemStyles";

type ConfigTab = "EVENTS" | "PRICING" | "ABSENCES";

export function MealConfigAndEvents() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("EVENTS");
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [priceConfigs, setPriceConfigs] = useState<MealPriceConfig[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    setError(null);
    try {
      const [events, prices, activeStays, people] = await Promise.all([fetchEventDays(), fetchMealPriceConfigs(), fetchStays(undefined, "active"), fetchEmployees()]);
      setEventDays(events);
      setPriceConfigs(prices);
      setStays(activeStays);
      setEmployees(people);
    } catch (cause: unknown) {
      console.error("Failed to load meal settings:", cause);
      setLoadError("Không thể tải cấu hình bữa ăn. Kiểm tra kết nối rồi thử lại.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);
  const changeTab = (tab: ConfigTab): void => { setActiveTab(tab); setError(null); setSuccessMsg(null); };

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1"><SystemTabs label="Cấu hình bữa ăn" active={activeTab} onChange={changeTab} items={[
        { key: "EVENTS", label: "Ngày sự kiện", count: !loading && !loadError ? eventDays.length : undefined },
        { key: "PRICING", label: "Loại ngày & đơn giá", count: !loading && !loadError ? priceConfigs.length : undefined },
        { key: "ABSENCES", label: "Vắng ăn" },
      ]} /></div>
      <button type="button" onClick={() => void loadData()} disabled={loading} className={systemSecondaryButton}>Làm mới</button>
    </div>
    {error && <p role="alert" className="rounded-sm border border-red-200 bg-white p-3 text-sm text-red-800">{error}</p>}
    {successMsg && <p role="status" className="rounded-sm border border-slate-200 bg-white p-3 text-sm text-slate-700">{successMsg}</p>}
    {loading ? <p role="status" className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải cấu hình bữa ăn…</p>
      : loadError ? <div role="alert" className="rounded-sm border border-red-200 bg-white p-4 text-sm"><p className="text-red-800">{loadError}</p><button type="button" onClick={() => void loadData()} className={`${systemSecondaryButton} mt-2`}>Thử lại</button></div>
        : activeTab === "EVENTS" ? <EventSettingsTab eventDays={eventDays} priceConfigs={priceConfigs} onDataChange={loadData} setError={setError} setSuccessMsg={setSuccessMsg} />
          : activeTab === "PRICING" ? <MealPriceConfigTab priceConfigs={priceConfigs} onDataChange={loadData} setError={setError} setSuccessMsg={setSuccessMsg} />
            : <MealAbsencesTab stays={stays} employees={employees} setError={setError} setSuccessMsg={setSuccessMsg} />}
  </div>;
}
