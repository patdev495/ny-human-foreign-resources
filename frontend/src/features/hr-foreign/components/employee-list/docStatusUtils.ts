import type { ForeignEmployee } from "../../types";

export const getDays = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const targetTime = new Date(dateStr).getTime();
  const todayTime = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((targetTime - todayTime) / (1000 * 60 * 60 * 24));
};

export type DocBadgeStatus = "missing" | "expired" | "warning" | "ok";

export const classifyDays = (days: number | null, threshold: number): DocBadgeStatus => {
  if (days === null) return "missing";
  if (days <= 0) return "expired";
  if (days <= threshold) return "warning";
  return "ok";
};

export const getEmployeeDocStatuses = (
  emp: ForeignEmployee,
  threshold: number
): DocBadgeStatus[] => {
  const passportStatus: DocBadgeStatus = !emp.passport_number
    ? "missing"
    : !emp.passport_expiry
    ? "warning"
    : classifyDays(getDays(emp.passport_expiry), threshold);

  const gpldStatus = classifyDays(getDays(emp.latest_gpld_expiry), threshold);
  const visaStatus = classifyDays(getDays(emp.latest_visa_expiry), threshold);
  const tamtruStatus = classifyDays(getDays(emp.latest_tamtru_expiry), threshold);
  const contractStatus = classifyDays(getDays(emp.latest_contract_expiry), threshold);

  return [passportStatus, gpldStatus, visaStatus, tamtruStatus, contractStatus];
};
