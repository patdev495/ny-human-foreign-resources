import type { ForeignEmployee } from "../../types";

export type JanitorLocation = "DORMITORY" | "CN09" | "CN15" | "COMPANY";
export type JanitorLocationFilter = "ALL" | JanitorLocation;
export type JanitorEmploymentFilter = "ALL" | "WORKING" | "RESIGNED";

export interface JanitorFormData {
  name_latin: string;
  employee_code: string;
  workplace_location: string;
  salary: number;
  salary_unit: string;
  role: string;
  status: string;
  resignation_date: string;
  notes: string;
}

export const janitorLocations: { value: JanitorLocation; label: string }[] = [
  { value: "DORMITORY", label: "KTX" },
  { value: "CN09", label: "Nhà máy CN09" },
  { value: "CN15", label: "Nhà máy CN15" },
  { value: "COMPANY", label: "Văn phòng công ty" },
];

export function janitorLocationLabel(location?: string | null): string {
  return janitorLocations.find((item) => item.value === (location || "DORMITORY"))?.label || location || "KTX";
}

export function isJanitor(employee: ForeignEmployee): boolean {
  return employee.employee_type === "JANITORIAL" || Boolean(employee.role?.toLocaleLowerCase().includes("tạp vụ"));
}

export function defaultJanitorForm(): JanitorFormData {
  return { name_latin: "", employee_code: "", workplace_location: "DORMITORY", salary: 8500000, salary_unit: "MONTH", role: "Tạp vụ KTX", status: "WORKING", resignation_date: "", notes: "" };
}
