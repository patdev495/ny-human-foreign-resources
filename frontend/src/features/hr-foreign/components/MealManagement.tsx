import React, { useState } from "react";
import { UtensilsCrossed, Calendar, Settings } from "lucide-react";
import { MealForecastBoard } from "./MealForecastBoard";
import { MealConfigAndEvents } from "./MealConfigAndEvents";
import { ModuleHeader } from "../../../shared/components/ModuleHeader";

export const MealManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"DAILY_FORECAST" | "CONFIG">(
    "DAILY_FORECAST"
  );

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Quản lý & Thống kê Suất ăn"
        subtitle="Dự báo và chốt suất ăn hằng ngày (Sáng & Tối), tổng hợp chi phí bữa ăn KTX và cấu hình đơn giá theo từng mốc thời gian / sự kiện."
        icon={UtensilsCrossed}
        theme="amber"
        tabs={[
          {
            key: "DAILY_FORECAST",
            label: "Thống kê & Chốt Suất Ăn",
            icon: <Calendar className="h-3.5 w-3.5" />,
          },
          {
            key: "CONFIG",
            label: "Cấu hình Đơn giá & Sự kiện",
            icon: <Settings className="h-3.5 w-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as "DAILY_FORECAST" | "CONFIG")}
      />

      {/* Render selected view */}
      {activeTab === "DAILY_FORECAST" && <MealForecastBoard />}
      {activeTab === "CONFIG" && <MealConfigAndEvents />}
    </div>
  );
};
