export interface ReportingDate {
  date: string
  can_submit: boolean
}

export type ShiftChoice = '17:30' | '20:00' | 'SELF_TRAVEL'
export type PickupLocation = 'CN09' | 'CN15'

export interface ShiftSelection {
  shift_choice: ShiftChoice
  pickup_location: PickupLocation | null
  destination: 'KTX'
}

export interface ShiftReportView {
  employee_id: number
  report_date: string
  current: ShiftSelection | null
}
