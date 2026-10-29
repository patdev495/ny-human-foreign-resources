export interface PublicPerson {
  id: number
  name_latin: string
  name_chinese: string | null
  room_number: string | null
  status: 'KTX' | 'HOTEL' | 'ABROAD' | 'UNASSIGNED'
  can_report: boolean
}

export interface ReportingDate {
  date: string
  can_submit: boolean
}

export interface MealSelection {
  breakfast: boolean
  dinner: boolean
}

export interface MealReportView {
  employee_id: number
  meal_date: string
  current: MealSelection | null
}
