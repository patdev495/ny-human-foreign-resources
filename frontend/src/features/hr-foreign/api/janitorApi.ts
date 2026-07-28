import { BASE } from "./apiUtils";

export interface JanitorAttendanceItem {
  employee_id: number;
  employee_code?: string | null;
  name_latin: string;
  name_chinese?: string | null;
  workplace_location?: string | null;
  status: "PRESENT" | "ABSENT";
  absence_type?: "FULL_DAY" | "HALF_DAY" | null;
  reason?: string | null;
}

export interface JanitorDailyAttendanceSheet {
  date: string;
  total_count: number;
  present_count: number;
  full_day_absence_count: number;
  half_day_absence_count: number;
  items: JanitorAttendanceItem[];
}

export interface JanitorAttendanceCreate {
  employee_id: number;
  attendance_date: string;
  absence_type: "FULL_DAY" | "HALF_DAY";
  reason?: string | null;
}

export interface JanitorAttendanceRangeCreate {
  employee_id: number;
  start_date: string;
  end_date: string;
  absence_type: "FULL_DAY" | "HALF_DAY";
  reason?: string | null;
}

export async function fetchDailyJanitorAttendance(
  targetDate: string
): Promise<JanitorDailyAttendanceSheet> {
  const res = await fetch(
    `${BASE}/janitors/attendance?target_date=${targetDate}`
  );
  if (!res.ok) {
    throw new Error("Không thể tải bảng điểm danh tạp vụ hàng ngày.");
  }
  return res.json();
}

export async function saveJanitorAbsence(
  payload: JanitorAttendanceCreate
): Promise<any> {
  const res = await fetch(`${BASE}/janitors/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Không thể lưu trạng thái vắng điểm danh.");
  }
  return res.json();
}

export async function saveJanitorRangeAbsence(
  payload: JanitorAttendanceRangeCreate
): Promise<any> {
  const res = await fetch(`${BASE}/janitors/attendance/range`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Không thể đăng ký nghỉ theo đợt.");
  }
  return res.json();
}

export async function resetJanitorAttendance(
  employeeId: number,
  targetDate: string
): Promise<any> {
  const res = await fetch(
    `${BASE}/janitors/attendance/${employeeId}?target_date=${targetDate}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    throw new Error("Không thể reset trạng thái điểm danh.");
  }
  return res.json();
}
