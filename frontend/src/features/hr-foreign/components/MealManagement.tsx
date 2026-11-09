import { useState } from "react";
import { MealForecastBoard } from "./MealForecastBoard";
import { MealConfigAndEvents } from "./MealConfigAndEvents";
import { SystemTabs } from "../../../shared/components/SystemTabs";

export function MealManagement() {
  const [activeTab, setActiveTab] = useState<"DAILY_FORECAST" | "CONFIG">("DAILY_FORECAST");
  return <div className="min-w-0 space-y-4">
    <h1 className="pb-1 text-xl font-semibold text-slate-900 sm:text-2xl">Chi phí bữa ăn</h1>
    <SystemTabs label="Quản lý bữa ăn" active={activeTab} onChange={setActiveTab} items={[
      { key: "DAILY_FORECAST", label: "Thống kê & chốt suất ăn" }, { key: "CONFIG", label: "Đơn giá & sự kiện" },
    ]} />
    {activeTab === "DAILY_FORECAST" ? <MealForecastBoard /> : <MealConfigAndEvents />}
  </div>;
}
