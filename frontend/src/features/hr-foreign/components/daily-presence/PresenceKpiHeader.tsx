import React from "react";
import { UserCheck, Home, Hotel, PlaneTakeoff } from "lucide-react";
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
  const isAllInVn = mainTab === "IN_VN" && activeSubTab === "ALL";
  const isKtx = mainTab === "IN_VN" && activeSubTab === "KTX";
  const isHotel = mainTab === "IN_VN" && activeSubTab === "HOTEL";
  const isExited = mainTab === "EXITED";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total present */}
      <button
        type="button"
        onClick={() => {
          setMainTab("IN_VN");
          setActiveSubTab("ALL");
        }}
        title="Xem tất cả nhân sự đang có mặt tại Việt Nam"
        className={`group text-left transition-all duration-200 cursor-pointer rounded-2xl p-5 border flex items-center justify-between select-none ${
          isAllInVn
            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-sm -translate-y-0.5"
            : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Đang ở Việt Nam
          </p>
          <h3 className="text-2xl font-black font-mono text-slate-900 mt-1">
            {data.summary.total_in_vn}
          </h3>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            Ngày: {data.target_date}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
            isAllInVn
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100"
          }`}
        >
          <UserCheck className="h-6 w-6" />
        </div>
      </button>

      {/* KTX Count */}
      <button
        type="button"
        onClick={() => {
          setMainTab("IN_VN");
          setActiveSubTab("KTX");
        }}
        title="Lọc nhân sự ở Ký túc xá"
        className={`group text-left transition-all duration-200 cursor-pointer rounded-2xl p-5 border flex items-center justify-between select-none ${
          isKtx
            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 shadow-sm -translate-y-0.5"
            : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tại Ký túc xá (KTX)
          </p>
          <h3 className="text-2xl font-black font-mono text-slate-900 mt-1">
            {data.summary.ktx_count}
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {data.ktx_groups.length} phòng đang ở
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
            isKtx
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100"
          }`}
        >
          <Home className="h-6 w-6" />
        </div>
      </button>

      {/* Hotel Count */}
      <button
        type="button"
        onClick={() => {
          setMainTab("IN_VN");
          setActiveSubTab("HOTEL");
        }}
        title="Lọc nhân sự ở Khách sạn"
        className={`group text-left transition-all duration-200 cursor-pointer rounded-2xl p-5 border flex items-center justify-between select-none ${
          isHotel
            ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 shadow-sm -translate-y-0.5"
            : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tại Khách sạn
          </p>
          <h3 className="text-2xl font-black font-mono text-slate-900 mt-1">
            {data.summary.hotel_count}
          </h3>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {data.hotel_groups.length} cơ sở lưu trú
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
            isHotel
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100"
          }`}
        >
          <Hotel className="h-6 w-6" />
        </div>
      </button>

      {/* Exited VN Count */}
      <button
        type="button"
        onClick={() => setMainTab("EXITED")}
        title="Lọc nhân sự đã về nước / xuất cảnh"
        className={`group text-left transition-all duration-200 cursor-pointer rounded-2xl p-5 border flex items-center justify-between select-none ${
          isExited
            ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 shadow-sm -translate-y-0.5"
            : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Đã về nước
          </p>
          <h3 className="text-2xl font-black font-mono text-slate-900 mt-1">
            {data.summary.exited_count}
          </h3>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            Nhân sự đã xuất cảnh
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
            isExited
              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
              : "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100"
          }`}
        >
          <PlaneTakeoff className="h-6 w-6" />
        </div>
      </button>
    </div>
  );
};
