import React, { useState, useEffect, useCallback } from "react";
import type {
  EventDay,
  MealPriceConfig,
  Stay,
  ForeignEmployee,
} from "../types";
import {
  fetchEventDays,
  fetchMealPriceConfigs,
  fetchStays,
  fetchEmployees,
} from "../api";
import { EventSettingsTab } from "./meal-config/EventSettingsTab";
import { MealPriceConfigTab } from "./meal-config/MealPriceConfigTab";
import { MealAbsencesTab } from "./meal-config/MealAbsencesTab";

export const MealConfigAndEvents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"EVENTS" | "PRICING" | "ABSENCES">("EVENTS");

  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [priceConfigs, setPriceConfigs] = useState<MealPriceConfig[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [evData, pData, sData, eData] = await Promise.all([
        fetchEventDays(),
        fetchMealPriceConfigs(),
        fetchStays(undefined, "active"),
        fetchEmployees(),
      ]);
      setEventDays(evData);
      setPriceConfigs(pData);
      setStays(sData);
      setEmployees(eData);
    } catch (err: any) {
      console.error("Failed to load configs and events:", err);
      setError(err.message || "Không thể tải dữ liệu cấu hình");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ⚙️ Cấu hình Suất ăn & Cài đặt Sự kiện
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý ngày sự kiện, bảng đơn giá cơm và lượt đăng ký cắt cơm nhân sự
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded shadow-sm">
          {successMsg}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => {
              setActiveTab("EVENTS");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`${
              activeTab === "EVENTS"
                ? "border-blue-500 text-blue-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition`}
          >
            🎯 Cài đặt Ngày Sự kiện ({eventDays.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("PRICING");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`${
              activeTab === "PRICING"
                ? "border-emerald-500 text-emerald-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition`}
          >
            💰 Cấu hình Loại ngày & Đơn giá ({priceConfigs.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("ABSENCES");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`${
              activeTab === "ABSENCES"
                ? "border-amber-500 text-amber-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition`}
          >
            🍽️ Đăng ký Vắng ăn
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Đang tải dữ liệu cấu hình...</div>
      ) : (
        <>
          {activeTab === "EVENTS" && (
            <EventSettingsTab
              eventDays={eventDays}
              priceConfigs={priceConfigs}
              onDataChange={loadData}
              setError={setError}
              setSuccessMsg={setSuccessMsg}
            />
          )}

          {activeTab === "PRICING" && (
            <MealPriceConfigTab
              priceConfigs={priceConfigs}
              onDataChange={loadData}
              setError={setError}
              setSuccessMsg={setSuccessMsg}
            />
          )}

          {activeTab === "ABSENCES" && (
            <MealAbsencesTab
              stays={stays}
              employees={employees}
              setError={setError}
              setSuccessMsg={setSuccessMsg}
            />
          )}
        </>
      )}
    </div>
  );
};
