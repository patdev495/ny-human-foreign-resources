import { useEffect, useState } from 'react'
import { getShiftDates, getShiftReport, saveShiftReport } from './api'
import type { PickupLocation, ReportingDate, ShiftChoice, ShiftSelection } from './types'
import { formatPortalDate, getPortalText, localizePortalError } from '../portal-localization'
import type { PortalLocale, PortalText } from '../portal-localization'

const button = 'w-full rounded-2xl px-5 py-4 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
const emptySelection: ShiftSelection = { shift_choice: '17:30', pickup_location: null, destination: 'KTX' }

interface Props {
  employeeId: number
  name: string
  room: string | null
  locale: PortalLocale
  onBack: () => void
}

export function EndShiftReporting({ employeeId, name, room, locale, onBack }: Props) {
  const text = getPortalText(locale)
  const [dates, setDates] = useState<ReportingDate[]>([])
  const [date, setDate] = useState('')
  const [selection, setSelection] = useState<ShiftSelection>(emptySelection)
  const [hasReport, setHasReport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<{ cause: unknown; fallback: keyof PortalText } | null>(null)
  const [message, setMessage] = useState<keyof PortalText | null>(null)

  useEffect(() => {
    let live = true
    getShiftDates().then(result => {
      if (!live) return
      setDates(result)
      setDate(result[0]?.date ?? '')
    }).catch((cause: unknown) => {
      if (live) setError({ cause, fallback: 'loadDatesError' })
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!date) return
    let live = true
    setReportLoading(true)
    setSelection(emptySelection)
    setHasReport(false)
    setMessage(null)
    setError(null)
    getShiftReport(employeeId, date).then(result => {
      if (!live) return
      setHasReport(result.current !== null)
      setSelection(result.current ?? emptySelection)
    }).catch((cause: unknown) => {
      if (live) setError({ cause, fallback: 'loadReportError' })
    }).finally(() => { if (live) setReportLoading(false) })
    return () => { live = false }
  }, [employeeId, date])

  const selectedDay = dates.find(item => item.date === date)

  async function submit() {
    if (!selectedDay?.can_submit || !date || saving || (selection.shift_choice !== 'SELF_TRAVEL' && !selection.pickup_location)) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await saveShiftReport(employeeId, date, selection)
      setHasReport(saved.current !== null)
      setSelection(saved.current ?? selection)
      setMessage('shiftSaved')
    } catch (cause: unknown) {
      setError({ cause, fallback: 'saveShiftError' })
    } finally {
      setSaving(false)
    }
  }

  return <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <button type="button" onClick={onBack} className="text-sm font-semibold text-indigo-700">← {text.functions}</button>
    <div><h2 className="text-xl font-bold">{text.shiftReporting}</h2><p className="text-sm text-slate-600">{name} • {text.room} {room}</p></div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{localizePortalError(error.cause, locale, error.fallback)}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{text[message]}</p>}
    {loading ? <p role="status">{text.loadingDates}</p> : <label className="block text-sm font-semibold">{text.workDate}
      <select value={date} onChange={event => setDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
        {dates.map(item => <option key={item.date} value={item.date}>{formatPortalDate(item.date, locale)}{item.can_submit ? '' : ` • ${text.viewOnly}`}</option>)}
      </select>
    </label>}
    {!loading && (reportLoading ? <p role="status">{text.loadingReport}</p> : <>
      <p className={`rounded-xl p-3 text-sm font-semibold ${hasReport ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{hasReport ? text.shiftReported : text.notReported}</p>
      <fieldset className="space-y-2" disabled={!selectedDay?.can_submit}>
        <legend className="text-sm font-semibold">{text.shiftChoice}</legend>
        {([['17:30', '17:30'], ['20:00', '20:00'], ['SELF_TRAVEL', text.selfTravel]] as const).map(([value, label]) => <label key={value} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
          <input type="radio" name="shift-choice" value={value} checked={selection.shift_choice === value} onChange={() => setSelection({ ...selection, shift_choice: value as ShiftChoice, pickup_location: value === 'SELF_TRAVEL' ? null : selection.pickup_location })} className="h-5 w-5 accent-indigo-700" />
          <span>{label}</span>
        </label>)}
      </fieldset>
      {selection.shift_choice !== 'SELF_TRAVEL' && <label className="block text-sm font-semibold">{text.pickupLocation}
        <select value={selection.pickup_location ?? ''} disabled={!selectedDay?.can_submit} onChange={event => setSelection({ ...selection, pickup_location: event.target.value as PickupLocation })} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
          <option value="">{text.selectPickup}</option><option value="CN09">CN09</option><option value="CN15">CN15</option>
        </select>
      </label>}
      <label className="block text-sm font-semibold">{text.destination}
        <input value={text.dormitory} readOnly className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700" />
      </label>
      {selectedDay?.can_submit ? <><p className="text-xs text-slate-600">{text.shiftDeadline}</p>
        <button type="button" disabled={saving || (selection.shift_choice !== 'SELF_TRAVEL' && !selection.pickup_location)} onClick={() => void submit()} className={`${button} bg-indigo-700 text-white hover:bg-indigo-800`}>{saving ? text.saving : hasReport ? text.saveChanges : text.submitShift}</button></> : <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{text.shiftClosed}</p>}
    </>)}
  </section>
}
