import type { ReportingDate, ShiftReportView, ShiftSelection } from './types'

const BASE = '/api/end-shift-reporting'

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body: { detail?: unknown } = await response.json().catch(() => ({})) as { detail?: unknown }
    throw new Error(typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export function getShiftDates(): Promise<ReportingDate[]> {
  return fetch(`${BASE}/dates`).then(read<ReportingDate[]>)
}

export function getShiftReport(employeeId: number, date: string): Promise<ShiftReportView> {
  return fetch(`${BASE}/people/${employeeId}/reports/${date}`).then(read<ShiftReportView>)
}

export function saveShiftReport(employeeId: number, date: string, selection: ShiftSelection): Promise<ShiftReportView> {
  return fetch(`${BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: employeeId, report_date: date, ...selection }),
  }).then(read<ShiftReportView>)
}
