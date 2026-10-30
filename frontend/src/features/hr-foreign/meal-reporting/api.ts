import type { MealReportView, MealSelection, PublicPerson, ReportingDate } from './types'

const BASE = '/api/meal-reporting'

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body: { detail?: unknown } = await response.json().catch(() => ({})) as { detail?: unknown }
    throw new Error(typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export function getPeople(query = ''): Promise<PublicPerson[]> {
  return fetch(`${BASE}/people?q=${encodeURIComponent(query)}`).then(read<PublicPerson[]>)
}

export function getDates(): Promise<ReportingDate[]> {
  return fetch(`${BASE}/dates`).then(read<ReportingDate[]>)
}

export function getReport(employeeId: number, date: string): Promise<MealReportView> {
  return fetch(`${BASE}/people/${employeeId}/reports/${date}`).then(read<MealReportView>)
}

export function saveReport(employeeId: number, date: string, selection: MealSelection): Promise<MealReportView> {
  return fetch(`${BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: employeeId, meal_date: date, ...selection }),
  }).then(read<MealReportView>)
}
