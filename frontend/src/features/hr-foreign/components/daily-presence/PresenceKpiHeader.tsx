import React from "react";
import type { DailyPresenceReportResponse } from "../../types";

interface Props {
  data: DailyPresenceReportResponse;
  mainTab: "IN_VN" | "EXITED";
  setMainTab: (tab: "IN_VN" | "EXITED") => void;
  activeSubTab: "ALL" | "KTX" | "HOTEL" | "UNASSIGNED";
  setActiveSubTab: (tab: "ALL" | "KTX" | "HOTEL" | "UNASSIGNED") => void;
}

export const PresenceKpiHeader: React.FC<Props> = ({
  data,
  mainTab,
  setMainTab,
  activeSubTab,
  setActiveSubTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total present */}
      <div
        onClick={() => {
          setMainTab("IN_VN");
          setActiveSubTab("ALL");
        }}
        title="Bấm để xem tất cả nhân sự đang có mặt tại VN"
        className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 bg-white rounded-2xl p-5 border flex items-center justify-between select-none ${
          mainTab === "IN_VN" && activeSubTab === "ALL"
            ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50/30 shadow-xs"
            : "border-slate-200 hover:border-blue-300"
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Đang ở Việt Nam
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {data.summary.total_in_vn}
          </h3>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">
            Ngày: {data.target_date}
          </p>
        </div>
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-blue-100">
          🇻🇳
        </div>
      </div>

      {/* KTX Count */}
      <div
        onClick={() => {
          setMainTab("IN_VN");
          setActiveSubTab("KTX");
        }}
        title="Bấm để lọc nhân sự ở Ký túc xá"
        className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 bg-white rounded-2xl p-5 border flex items-center justify-between select-none ${
          mainTab === "IN_VN" && activeSubTab === "KTX"
            ? "border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/30 shadow-xs"
            : "border-slate-200 hover:border-emerald-300"
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tại Ký túc xá (KTX)
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {data.summary.ktx_count}
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {data.ktx_groups.length} phòng đang ở
          </p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-emerald-100">
          🏢
        </div>
      </div>

      {/* Hotel Count */}
      <div
        onClick={() => {
          setMainTab("IN_VN");
          setActiveSubTab("HOTEL");
        }}
        title="Bấm để lọc nhân sự ở Khách sạn"
        className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 bg-white rounded-2xl p-5 border flex items-center justify-between select-none ${
          mainTab === "IN_VN" && activeSubTab === "HOTEL"
            ? "border-amber-500 ring-2 ring-amber-500 bg-amber-50/30 shadow-xs"
            : "border-slate-200 hover:border-amber-300"
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tại Khách sạn
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {data.summary.hotel_count}
          </h3>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {data.hotel_groups.length} cơ sở lưu trú
          </p>
        </div>
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-amber-100">
          🏨
        </div>
      </div>

      {/* Exited Count */}
      <div
        onClick={() => setMainTab("EXITED")}
        title="Bấm để xem danh sách nhân sự đã về nước"
        className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 bg-white rounded-2xl p-5 border flex items-center justify-between select-none ${
          mainTab === "EXITED"
            ? "border-rose-500 ring-2 ring-rose-500 bg-rose-50/30 shadow-xs"
            : "border-slate-200 hover:border-rose-300"
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Đã về nước (Ở nước ngoài)
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {data.summary.exited_count || 0}
          </h3>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            Tạm vắng mặt tại VN
          </p>
        </div>
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl font-black border border-rose-100">
          ✈️
        </div>
      </div>
    </div>
  );
};
