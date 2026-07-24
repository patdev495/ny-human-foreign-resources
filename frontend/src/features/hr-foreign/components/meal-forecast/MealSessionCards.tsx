import React from "react";
import type { DailyMealForecastResponse, DailyMealSessionSummary } from "../../types";

interface Props {
  forecast: DailyMealForecastResponse;
  onLockSession: (session: DailyMealSessionSummary) => void;
}

export const MealSessionCards: React.FC<Props> = ({ forecast, onLockSession }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Breakfast Card */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-xs ${
          forecast.breakfast.is_locked
            ? "bg-emerald-50/50 border-emerald-300"
            : "bg-amber-50/40 border-amber-300/80"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl text-xl">🍳</span>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Bữa Sáng</h3>
              <p className="text-xs text-slate-500 font-medium">
                {forecast.breakfast.is_locked ? (
                  <span className="text-emerald-700 font-bold">🔒 Đã Chốt chính thức</span>
                ) : (
                  <span className="text-amber-700 font-semibold">⏳ Chưa chốt</span>
                )}
              </p>
            </div>
          </div>

          {!forecast.breakfast.is_locked ? (
            <button
              onClick={() => onLockSession(forecast.breakfast)}
              className="px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              🔒 Chốt Bữa Sáng
            </button>
          ) : (
            <button
              onClick={() => onLockSession(forecast.breakfast)}
              title="Bấm để điều chỉnh / chốt lại suất ăn"
              className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>✓ Đã Khóa</span>
              <span className="text-[11px] font-semibold text-emerald-700 underline ml-1">✏️ Cập nhật</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Suất gợi ý tự động:</span>
            <span className="text-lg font-black text-slate-800">
              {forecast.breakfast.calculated_meal_count} <span className="text-xs font-normal text-slate-500">suất</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Suất thực chốt:</span>
            <span className={`text-lg font-black ${forecast.breakfast.is_locked ? "text-emerald-700" : "text-slate-400"}`}>
              {forecast.breakfast.is_locked
                ? `${forecast.breakfast.final_meal_count} suất`
                : "--"}
            </span>
          </div>
        </div>

        {forecast.breakfast.is_locked && (
          <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá chốt:</span>
              <strong className="text-slate-800">
                {forecast.breakfast.locked_price_per_meal?.toLocaleString()} VNĐ
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thành tiền chốt:</span>
              <strong className="text-emerald-800 font-bold">
                {(
                  (forecast.breakfast.final_meal_count ?? 0) *
                  (forecast.breakfast.locked_price_per_meal ?? 0)
                ).toLocaleString()}{" "}
                VNĐ
              </strong>
            </div>
            {forecast.breakfast.notes && (
              <div className="text-[11px] text-slate-500 italic mt-1">
                Ghi chú: {forecast.breakfast.notes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dinner Card */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-xs ${
          forecast.dinner.is_locked
            ? "bg-emerald-50/50 border-emerald-300"
            : "bg-indigo-50/40 border-indigo-300/80"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-xl">🍲</span>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Bữa Tối</h3>
              <p className="text-xs text-slate-500 font-medium">
                {forecast.dinner.is_locked ? (
                  <span className="text-emerald-700 font-bold">🔒 Đã Chốt chính thức</span>
                ) : (
                  <span className="text-indigo-700 font-semibold">⏳ Chưa chốt</span>
                )}
              </p>
            </div>
          </div>

          {!forecast.dinner.is_locked ? (
            <button
              onClick={() => onLockSession(forecast.dinner)}
              className="px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              🔒 Chốt Bữa Tối
            </button>
          ) : (
            <button
              onClick={() => onLockSession(forecast.dinner)}
              title="Bấm để điều chỉnh / chốt lại suất ăn"
              className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>✓ Đã Khóa</span>
              <span className="text-[11px] font-semibold text-emerald-700 underline ml-1">✏️ Cập nhật</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Suất gợi ý tự động:</span>
            <span className="text-lg font-black text-slate-800">
              {forecast.dinner.calculated_meal_count} <span className="text-xs font-normal text-slate-500">suất</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Suất thực chốt:</span>
            <span className={`text-lg font-black ${forecast.dinner.is_locked ? "text-emerald-700" : "text-slate-400"}`}>
              {forecast.dinner.is_locked
                ? `${forecast.dinner.final_meal_count} suất`
                : "--"}
            </span>
          </div>
        </div>

        {forecast.dinner.is_locked && (
          <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá chốt:</span>
              <strong className="text-slate-800">
                {forecast.dinner.locked_price_per_meal?.toLocaleString()} VNĐ
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thành tiền chốt:</span>
              <strong className="text-emerald-800 font-bold">
                {(
                  (forecast.dinner.final_meal_count ?? 0) *
                  (forecast.dinner.locked_price_per_meal ?? 0)
                ).toLocaleString()}{" "}
                VNĐ
              </strong>
            </div>
            {forecast.dinner.notes && (
              <div className="text-[11px] text-slate-500 italic mt-1">
                Ghi chú: {forecast.dinner.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
