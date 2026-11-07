import { useEffect, useState } from 'react'
import { Bus, ChevronDown, RefreshCw } from 'lucide-react'
import { getTodayShiftDemand } from './api'
import type { DemandKey, DemandView } from './types'
import { formatPortalDate, getPortalText } from '../portal-localization'
import type { PortalLocale } from '../portal-localization'

interface Props {
  employeeId: number
  locale: PortalLocale
}

const rideGroups: DemandKey[] = ['CN09_1730', 'CN15_1730', 'CN09_2000', 'CN15_2000']
const groupOrder: DemandKey[] = [...rideGroups, 'SELF_TRAVEL', 'NOT_REPORTED']
const rideLabels: Partial<Record<DemandKey, string>> = {
  CN09_1730: 'CN09 · 17:30', CN15_1730: 'CN15 · 17:30',
  CN09_2000: 'CN09 · 20:00', CN15_2000: 'CN15 · 20:00',
}

export function TodayShuttleDemand({ employeeId, locale }: Props) {
  const text = getPortalText(locale)
  const [demand, setDemand] = useState<DemandView | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const [expanded, setExpanded] = useState<Partial<Record<DemandKey, boolean>>>({})

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFailed(false)
    getTodayShiftDemand(controller.signal).then(result => {
      if (controller.signal.aborted) return
      setDemand(result)
      setUpdatedAt(new Date())
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [revision])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setRevision(current => current + 1)
    }
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  const total = demand?.groups.reduce((sum, group) => sum + (rideGroups.includes(group.key) ? group.count : 0), 0) ?? 0
  const countLabel = (count: number) => count === 1 ? text.riderCountOne : text.riderCount.replace('{count}', String(count))
  const updateTime = updatedAt ? new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(updatedAt) : ''

  return <section aria-labelledby="today-shuttle-title" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="space-y-2 p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-indigo-50 p-2 text-indigo-700"><Bus className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 id="today-shuttle-title" className="text-lg font-bold text-slate-900">{text.todayShuttle}</h2>
          {demand && <p className="mt-1 text-xs text-slate-500">{formatPortalDate(demand.date, locale)}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm font-semibold text-indigo-800">
          {demand ? text.registeredRiders.replace('{count}', String(total)) : loading ? text.loadingRides : ''}
        </p>
        <button type="button" disabled={loading} onClick={() => setRevision(current => current + 1)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />{text.refresh}
        </button>
      </div>
      {updatedAt && <p className="text-xs text-slate-500">{text.updatedAt.replace('{time}', updateTime)}</p>}
      {failed && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        {text.loadRidesError}{demand && ` ${text.staleRides}`}
      </p>}
    </div>
    {demand && <div className="border-t border-slate-100">
      {groupOrder.map(key => {
        const group = demand.groups.find(item => item.key === key)
        if (!group) return null
        const isRide = rideGroups.includes(key)
        const isOwnGroup = isRide && group.people.some(person => person.employee_id === employeeId)
        const isExpanded = expanded[key] ?? isOwnGroup
        const label = rideLabels[key] ?? (key === 'SELF_TRAVEL' ? text.selfTravel : text.notReported)
        return <div key={key} className={`border-b border-slate-100 last:border-b-0 ${isOwnGroup ? 'bg-indigo-50/60' : ''}`}>
          <h3><button type="button" aria-expanded={isExpanded} aria-controls={`shuttle-${key}`}
            onClick={() => setExpanded(current => ({ ...current, [key]: !isExpanded }))}
            className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-600 sm:px-6">
            <span className={`min-w-0 flex-1 text-sm ${isRide ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
              {label}{isOwnGroup && <span className="mt-1 block text-xs font-semibold text-indigo-700">{text.yourGroup}</span>}
            </span>
            <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${isRide ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'}`}>{countLabel(group.count)}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button></h3>
          <div id={`shuttle-${key}`} hidden={!isExpanded} className="px-5 pb-2 sm:px-6">
            {group.people.length === 0 ? <p className="pb-3 text-sm text-slate-500">{text.noRiders}</p> : <ul className="divide-y divide-slate-200/60 border-t border-slate-200/60">
              {group.people.map(person => <li key={person.employee_id} className="py-3 text-sm">
                <p className="break-words font-semibold text-slate-800">{person.name_latin}
                  {person.employee_id === employeeId && <span className="ml-2 text-xs text-indigo-700">({text.you})</span>}
                </p>
                {person.name_chinese && <p className="mt-0.5 text-slate-600">{person.name_chinese}</p>}
                {person.room_number && <p className="mt-1 text-xs text-slate-500">{text.room} {person.room_number}</p>}
              </li>)}
            </ul>}
          </div>
        </div>
      })}
    </div>}
  </section>
}
