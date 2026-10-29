export interface DemandPerson {
  employee_id: number
  name_latin: string
  name_chinese: string | null
  room_number: string | null
}

export type DemandKey = 'CN09_1730' | 'CN09_2000' | 'CN15_1730' | 'CN15_2000' | 'SELF_TRAVEL' | 'NOT_REPORTED'

export interface DemandGroup {
  key: DemandKey
  count: number
  people: DemandPerson[]
}

export interface DemandView {
  date: string
  groups: DemandGroup[]
}

export async function fetchEndShiftDemand(date: string): Promise<DemandView> {
  const response = await fetch(`/api/hr-foreign/end-shift/demand?date=${encodeURIComponent(date)}`)
  if (!response.ok) throw new Error(`Không thể tải khai báo giờ tan làm (${response.status})`)
  return response.json() as Promise<DemandView>
}
