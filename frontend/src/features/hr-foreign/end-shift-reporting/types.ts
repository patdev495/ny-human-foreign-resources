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

export type DemandKey = 'CN09_1730' | 'CN09_2000' | 'CN15_1730' | 'CN15_2000' | 'SELF_TRAVEL' | 'NOT_REPORTED'

export interface DemandPerson {
  employee_id: number
  name_latin: string
  name_chinese: string | null
  room_number: string | null
}

export interface DemandGroup {
  key: DemandKey
  count: number
  people: DemandPerson[]
}

export interface DemandView {
  date: string
  groups: DemandGroup[]
}
