import React from "react";
import type { DailyMealForecastResponse, DailyMealSessionSummary } from "../../types";

interface Props {
  forecast: DailyMealForecastResponse;
  onLockSession: (session: DailyMealSessionSummary) => void;
}

export const MealSessionCards: React.FC<Props> = ({ forecast, onLockSession }) => {
  const breakfast = forecast?.breakfast || {
    meal_session: "BREAKFAST",
    calculated_meal_count: 0,
    is_locked: false,
  };
  const lunch = forecast?.lunch || {
    meal_session: "LUNCH",
    calculated_meal_count: 0,
    is_locked: false,
  };
  const dinner = forecast?.dinner || {
    meal_session: "DINNER",
    calculated_meal_count: 0,
    is_locked: false,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Breakfast Card */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-xs ${
          breakfast.is_locked
            ? "bg-emerald-50/50 border-emerald-300"
            : "bg-amber-50/40 border-amber-300/80"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl text-xl">🍳</span>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Sáng (Nước ngoài)</h3>
              <p className="text-xs text-slate-500 font-medium">
                {breakfast.is_locked ? (
                  <span className="text-emerald-700 font-bold">🔒 Đã Chốt chính thức</span>
                ) : (
                  <span className="text-amber-700 font-semibold">⏳ Chưa chốt</span>
                )}
              </p>
            </div>
          </div>

          {!breakfast.is_locked ? (
            <button
              onClick={() => onLockSession(breakfast)}
              className="px-3 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              🔒 Chốt Sáng
            </button>
          ) : (
            <button
              onClick={() => onLockSession(breakfast)}
              title="Bấm để điều chỉnh / chốt lại suất ăn"
              className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>✓ Khóa</span>
              <span className="text-[11px] font-semibold text-emerald-700 underline ml-0.5">✏️ Sửa</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Gợi ý tự động:</span>
            <span className="text-lg font-black text-slate-800">
              {breakfast.calculated_meal_count} <span className="text-xs font-normal text-slate-500">suất</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Suất thực chốt:</span>
            <span className={`text-lg font-black ${breakfast.is_locked ? "text-emerald-700" : "text-slate-400"}`}>
              {breakfast.is_locked
                ? `${breakfast.final_meal_count} suất`
                : "--"}
            </span>
          </div>
        </div>

        {breakfast.is_locked && (
          <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá chốt:</span>
              <strong className="text-slate-800">
                {breakfast.locked_price_per_meal?.toLocaleString()} VNĐ
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thành tiền:</span>
              <strong className="text-emerald-800 font-bold">
                {(
                  (breakfast.final_meal_count ?? 0) *
                  (breakfast.locked_price_per_meal ?? 0)
                ).toLocaleString()}{" "}
                VNĐ
              </strong>
            </div>
            {breakfast.notes && (
              <div className="text-[11px] text-slate-500 italic mt-1">
                Ghi chú: {breakfast.notes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lunch (Janitor) Card */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-xs ${
          lunch.is_locked
            ? "bg-emerald-50/50 border-emerald-300"
            : "bg-teal-50/40 border-teal-300/80"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-teal-100 text-teal-700 rounded-xl text-xl">☀️</span>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Trưa (Lao công)</h3>
              <p className="text-xs text-slate-500 font-medium">
                {lunch.is_locked ? (
                  <span className="text-emerald-700 font-bold">🔒 Đã Chốt chính thức</span>
                ) : (
                  <span className="text-teal-700 font-semibold">⏳ Chưa chốt</span>
                )}
              </p>
            </div>
          </div>

          {!lunch.is_locked ? (
            <button
              onClick={() => onLockSession(lunch)}
              className="px-3 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              🔒 Chốt Trưa
            </button>
          ) : (
            <button
              onClick={() => onLockSession(lunch)}
              title="Bấm để điều chỉnh / chốt lại suất ăn"
              className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>✓ Khóa</span>
              <span className="text-[11px] font-semibold text-emerald-700 underline ml-0.5">✏️ Sửa</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Quy định ăn:</span>
            <span className="text-sm font-bold text-slate-800">
              1 bữa / ngày
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Suất thực chốt:</span>
            <span className={`text-lg font-black ${lunch.is_locked ? "text-emerald-700" : "text-slate-400"}`}>
              {lunch.is_locked
                ? `${lunch.final_meal_count} suất`
                : "--"}
            </span>
          </div>
        </div>

        {lunch.is_locked && (
          <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá chốt:</span>
              <strong className="text-slate-800">
                {lunch.locked_price_per_meal?.toLocaleString()} VNĐ
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thành tiền:</span>
              <strong className="text-emerald-800 font-bold">
                {(
                  (lunch.final_meal_count ?? 0) *
                  (lunch.locked_price_per_meal ?? 0)
                ).toLocaleString()}{" "}
                VNĐ
              </strong>
            </div>
            {lunch.notes && (
              <div className="text-[11px] text-slate-500 italic mt-1">
                Ghi chú: {lunch.notes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dinner Card */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-xs ${
          dinner.is_locked
            ? "bg-emerald-50/50 border-emerald-300"
            : "bg-indigo-50/40 border-indigo-300/80"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-xl">🍲</span>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Tối (Nước ngoài)</h3>
              <p className="text-xs text-slate-500 font-medium">
                {dinner.is_locked ? (
                  <span className="text-emerald-700 font-bold">🔒 Đã Chốt chính thức</span>
                ) : (
                  <span className="text-indigo-700 font-semibold">⏳ Chưa chốt</span>
                )}
              </p>
            </div>
          </div>

          {!dinner.is_locked ? (
            <button
              onClick={() => onLockSession(dinner)}
              className="px-3 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              🔒 Chốt Tối
            </button>
          ) : (
            <button
              onClick={() => onLockSession(dinner)}
              title="Bấm để điều chỉnh / chốt lại suất ăn"
              className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>✓ Khóa</span>
              <span className="text-[11px] font-semibold text-emerald-700 underline ml-0.5">✏️ Sửa</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Gợi ý tự động:</span>
            <span className="text-lg font-black text-slate-800">
              {dinner.calculated_meal_count} <span className="text-xs font-normal text-slate-500">suất</span>
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Suất thực chốt:</span>
            <span className={`text-lg font-black ${dinner.is_locked ? "text-emerald-700" : "text-slate-400"}`}>
              {dinner.is_locked
                ? `${dinner.final_meal_count} suất`
                : "--"}
            </span>
          </div>
        </div>

        {dinner.is_locked && (
          <div className="mt-3 pt-3 border-t border-emerald-200/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá chốt:</span>
              <strong className="text-slate-800">
                {dinner.locked_price_per_meal?.toLocaleString()} VNĐ
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thành tiền:</span>
              <strong className="text-emerald-800 font-bold">
                {(
                  (dinner.final_meal_count ?? 0) *
                  (dinner.locked_price_per_meal ?? 0)
                ).toLocaleString()}{" "}
                VNĐ
              </strong>
            </div>
            {dinner.notes && (
              <div className="text-[11px] text-slate-500 italic mt-1">
                Ghi chú: {dinner.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
