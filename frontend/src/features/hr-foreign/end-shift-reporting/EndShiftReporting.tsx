import { useEffect, useState } from 'react'
import { getShiftDates, getShiftReport, saveShiftReport } from './api'
import type { PickupLocation, ReportingDate, ShiftChoice, ShiftSelection } from './types'

const button = 'w-full rounded-2xl px-5 py-4 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
const emptySelection: ShiftSelection = { shift_choice: '17:30', pickup_location: null, destination: 'KTX' }

export function weekdayLabel(date: string): string {
  return `${new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}, ${date}`
}

interface Props {
  employeeId: number
  name: string
  room: string | null
  onBack: () => void
}

export function EndShiftReporting({ employeeId, name, room, onBack }: Props) {
  const [dates, setDates] = useState<ReportingDate[]>([])
  const [date, setDate] = useState('')
  const [selection, setSelection] = useState<ShiftSelection>(emptySelection)
  const [hasReport, setHasReport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let live = true
    getShiftDates().then(result => {
      if (!live) return
      setDates(result)
      setDate(result[0]?.date ?? '')
    }).catch((cause: unknown) => {
      if (live) setError(cause instanceof Error ? cause.message : 'Could not load dates.')
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!date) return
    let live = true
    setReportLoading(true)
    setSelection(emptySelection)
    setHasReport(false)
    setMessage('')
    setError('')
    getShiftReport(employeeId, date).then(result => {
      if (!live) return
      setHasReport(result.current !== null)
      setSelection(result.current ?? emptySelection)
    }).catch((cause: unknown) => {
      if (live) setError(cause instanceof Error ? cause.message : 'Could not load report.')
    }).finally(() => { if (live) setReportLoading(false) })
    return () => { live = false }
  }, [employeeId, date])

  const selectedDay = dates.find(item => item.date === date)

  async function submit() {
    if (!selectedDay?.can_submit || !date || saving || (selection.shift_choice !== 'SELF_TRAVEL' && !selection.pickup_location)) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const saved = await saveShiftReport(employeeId, date, selection)
      setHasReport(saved.current !== null)
      setSelection(saved.current ?? selection)
      setMessage('End of shift report saved. HR can see your latest choice.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not save report.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <button type="button" onClick={onBack} className="text-sm font-semibold text-indigo-700">← Functions</button>
    <div><h2 className="text-xl font-bold">End of shift reporting</h2><p className="text-sm text-slate-600">{name} • Room {room}</p></div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    {loading ? <p role="status">Loading dates…</p> : <label className="block text-sm font-semibold">Work date
      <select value={date} onChange={event => setDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
        {dates.map(item => <option key={item.date} value={item.date}>{weekdayLabel(item.date)}{item.can_submit ? '' : ' • View only'}</option>)}
      </select>
    </label>}
    {!loading && (reportLoading ? <p role="status">Loading report…</p> : <>
      <p className={`rounded-xl p-3 text-sm font-semibold ${hasReport ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{hasReport ? 'Reported • current choice below' : 'Not reported yet'}</p>
      <fieldset className="space-y-2" disabled={!selectedDay?.can_submit}>
        <legend className="text-sm font-semibold">End of shift choice</legend>
        {([['17:30', '17h30'], ['20:00', '20h00'], ['SELF_TRAVEL', 'Self travel • no car needed']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
          <input type="radio" name="shift-choice" value={value} checked={selection.shift_choice === value} onChange={() => setSelection({ ...selection, shift_choice: value as ShiftChoice, pickup_location: value === 'SELF_TRAVEL' ? null : selection.pickup_location })} className="h-5 w-5 accent-indigo-700" />
          <span>{label}</span>
        </label>)}
      </fieldset>
      {selection.shift_choice !== 'SELF_TRAVEL' && <label className="block text-sm font-semibold">Pickup location
        <select value={selection.pickup_location ?? ''} disabled={!selectedDay?.can_submit} onChange={event => setSelection({ ...selection, pickup_location: event.target.value as PickupLocation })} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
          <option value="">Select pickup location</option><option value="CN09">CN09</option><option value="CN15">CN15</option>
        </select>
      </label>}
      <label className="block text-sm font-semibold">Destination
        <input value="KTX" readOnly className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700" />
      </label>
      {selectedDay?.can_submit ? <><p className="text-xs text-slate-600">Submit or change before 17:00 Vietnam time on this work date.</p>
        <button type="button" disabled={saving || (selection.shift_choice !== 'SELF_TRAVEL' && !selection.pickup_location)} onClick={() => void submit()} className={`${button} bg-indigo-700 text-white hover:bg-indigo-800`}>{saving ? 'Saving…' : hasReport ? 'Save changes' : 'Submit report'}</button></> : <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">View only. The 17:00 deadline has passed for this date.</p>}
    </>)}
  </section>
}
