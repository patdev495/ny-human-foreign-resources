import { useEffect, useState } from 'react'
import { fetchEndShiftDemand } from '../endShiftApi'
import type { DemandKey, DemandView } from '../endShiftApi'

const groupLabels: Record<DemandKey, string> = {
  CN09_1730: 'CN09 • tan làm 17h30',
  CN09_2000: 'CN09 • tan làm 20h00',
  CN15_1730: 'CN15 • tan làm 17h30',
  CN15_2000: 'CN15 • tan làm 20h00',
  SELF_TRAVEL: 'Tự di chuyển',
  NOT_REPORTED: 'Chưa báo giờ tan làm',
}

function todayVietnam(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function EndShiftDemand() {
  const [date, setDate] = useState(todayVietnam)
  const [demand, setDemand] = useState<DemandView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    fetchEndShiftDemand(date).then(result => { if (live) setDemand(result) })
      .catch((cause: unknown) => { if (live) setError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu.') })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [date])

  const carCount = demand?.groups.slice(0, 4).reduce((sum, group) => sum + group.count, 0) ?? 0

  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div><h2 className="text-lg font-bold text-slate-900">Nhu cầu xe tan làm</h2>
        <p className="mt-1 text-sm text-slate-600">Khai báo từ cổng 8006. Giờ hiển thị là giờ tan làm; HR tự sắp xếp xe.</p></div>
      <label className="text-sm font-semibold text-slate-700">Ngày làm việc
        <input type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2" />
      </label>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {loading ? <p role="status" className="rounded-xl bg-white p-5 text-sm text-slate-600">Đang tải khai báo…</p> : demand && <>
      <p className="rounded-xl bg-cyan-50 p-4 text-sm font-semibold text-cyan-900">{carCount} người đã báo cần xe • Chưa báo không tính vào nhu cầu xe</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {demand.groups.map(group => <article key={group.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900">{groupLabels[group.key]}</h3>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-bold text-cyan-900" aria-label={`${group.count} người`}>{group.count}</span>
          </div>
          {group.people.length === 0 ? <p className="pt-4 text-sm text-slate-500">Không có người</p> : <ul className="divide-y divide-slate-100">
            {group.people.map(person => <li key={person.employee_id} className="py-3 text-sm">
              <span className="font-semibold text-slate-800">{person.name_latin}</span>
              {person.name_chinese && <span className="ml-2 text-slate-500">{person.name_chinese}</span>}
              {person.room_number && <span className="block text-xs text-slate-500">Phòng KTX {person.room_number}</span>}
            </li>)}
          </ul>}
        </article>)}
      </div>
    </>}
  </section>
}
