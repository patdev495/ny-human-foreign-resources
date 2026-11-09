import type { MonthlyVehicleContract } from "../../types";

export interface ContractEditPackage {
  contract: MonthlyVehicleContract;
  linkedContractIds: number[];
}

export function applyContractEdits(target: MonthlyVehicleContract, source: MonthlyVehicleContract): MonthlyVehicleContract {
  return { ...target, contract_name: source.contract_name, base_monthly_cost: source.base_monthly_cost,
    km_allowance: source.km_allowance, excess_km_rate: source.excess_km_rate,
    overtime_rate_weekday: source.overtime_rate_weekday, sunday_daily_rate: source.sunday_daily_rate,
    overtime_rate_weekend: source.overtime_rate_weekend, standard_start_time: source.standard_start_time,
    standard_end_time: source.standard_end_time, sunday_standard_start_time: source.sunday_standard_start_time,
    sunday_standard_end_time: source.sunday_standard_end_time };
}

export function contractDocumentKey(contract: MonthlyVehicleContract): string | null {
  const name = `${contract.contract_name} ${contract.vehicle_name || ""}`.toLocaleLowerCase("vi-VN");
  if (name.includes("7 chỗ") || name.includes("innova")) return "HD_7seat_DucAnh";
  if (name.includes("tải") || name.includes("cnhtc")) return "HD_xetai_DucAnh";
  return null;
}

export function contractDetails(contract: MonthlyVehicleContract): { label: string; value: string }[] {
  const price = (value: number, unit: string) => `${value.toLocaleString("vi-VN")} đ/${unit}`;
  return [
    { label: "Giờ chuẩn T2–T7", value: `${contract.standard_start_time} → ${contract.standard_end_time}` },
    { label: "Giờ chuẩn Chủ nhật", value: `${contract.sunday_standard_start_time || "—"} → ${contract.sunday_standard_end_time || "—"}` },
    { label: "Phụ cấp tối cố định", value: price(contract.evening_fixed_bonus_amount, "ca") },
    { label: "Khung phụ cấp tối", value: `${contract.evening_fixed_bonus_start || "—"} → ${contract.evening_fixed_bonus_end || "—"}` },
    { label: "Tăng ca ngày thường", value: price(contract.overtime_rate_weekday, "giờ") },
    { label: "Tăng ca Chủ nhật", value: price(contract.overtime_rate_weekend, "giờ") },
    { label: "Mức ngày Chủ nhật", value: price(contract.sunday_daily_rate, "ngày") },
    { label: "Mức ngày lễ / Tết", value: price(contract.holiday_daily_rate, "ngày") },
    { label: "Qua đêm", value: price(contract.overnight_fee, "đêm") },
    { label: "Ăn ngoài", value: price(contract.meal_allowance_fee, "bữa") },
  ];
}
