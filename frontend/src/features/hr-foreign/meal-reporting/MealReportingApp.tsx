import { useEffect, useState } from 'react'
import { getDates, getPeople, getReport, saveReport } from './api'
import type { MealSelection, PublicPerson, ReportingDate } from './types'

type Screen = 'choose' | 'confirm' | 'menu' | 'report'
const STORAGE_KEY = 'ny-meal-person-id'
const statusLabel: Record<PublicPerson['status'], string> = {
  KTX: 'Dormitory', HOTEL: 'Hotel', ABROAD: 'Returned home', UNASSIGNED: 'No dormitory room',
}
const button = 'w-full rounded-2xl px-5 py-4 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export function MealReportingApp() {
  const [people, setPeople] = useState<PublicPerson[]>([])
  const [dates, setDates] = useState<ReportingDate[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [candidate, setCandidate] = useState<PublicPerson | null>(null)
  const [screen, setScreen] = useState<Screen>('choose')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [selection, setSelection] = useState<MealSelection>({ breakfast: false, dinner: false })
  const [hasReport, setHasReport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    Promise.all([getPeople(), getDates()]).then(([peopleResult, datesResult]) => {
      if (!live) return
      setPeople(peopleResult)
      setDates(datesResult)
      setDate(datesResult[0]?.date ?? '')
      const remembered = Number(localStorage.getItem(STORAGE_KEY))
      const person = peopleResult.find(item => item.id === remembered)
      if (person?.can_report) {
        setSelectedId(person.id)
        setScreen('menu')
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }).catch((cause: unknown) => {
      if (live) setError(cause instanceof Error ? cause.message : 'Could not load the portal.')
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  const person = people.find(item => item.id === selectedId) ?? null
  const day = dates.find(item => item.date === date)

  useEffect(() => {
    if (screen !== 'report' || selectedId === null || !date) return
    let live = true
    setReportLoading(true)
    setHasReport(false)
    setSelection({ breakfast: false, dinner: false })
    setError('')
    setMessage('')
    getReport(selectedId, date).then(result => {
      if (!live) return
      setHasReport(result.current !== null)
      setSelection(result.current ?? { breakfast: false, dinner: false })
    }).catch((cause: unknown) => {
      if (live) setError(cause instanceof Error ? cause.message : 'Could not load report.')
    }).finally(() => { if (live) setReportLoading(false) })
    return () => { live = false }
  }, [screen, selectedId, date])

  function confirmPerson() {
    if (!candidate?.can_report) return
    localStorage.setItem(STORAGE_KEY, String(candidate.id))
    setSelectedId(candidate.id)
    setCandidate(null)
    setScreen('menu')
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setSelectedId(null)
    setCandidate(null)
    setScreen('choose')
    setMessage('')
    setError('')
  }

  async function submit() {
    if (!person || !date || !day?.can_submit || saving) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const saved = await saveReport(person.id, date, selection)
      setSelection(saved.current ?? selection)
      setHasReport(saved.current !== null)
      setMessage('Meal report saved. HR can see your latest choices.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not save report. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = people.filter(item => {
    const query = search.trim().toLocaleLowerCase()
    return !query || item.name_latin.toLocaleLowerCase().includes(query) || (item.name_chinese ?? '').toLocaleLowerCase().includes(query)
  })

  return <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-900 sm:py-12">
    <div className="mx-auto max-w-lg space-y-6">
      <header className="rounded-3xl bg-indigo-950 px-6 py-7 text-white shadow-lg">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">NY • Employee portal</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Meal reporting</h1>
        <p className="mt-2 text-sm text-indigo-100">Breakfast and dinner at the dormitory</p>
      </header>

      {loading && <p className="rounded-2xl bg-white p-6 text-center" role="status">Loading…</p>}
      {error && <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{error}</div>}
      {message && <div role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</div>}

      {!loading && screen === 'choose' && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold">Find your name</h2>
          <p className="mt-1 text-sm text-slate-600">Select your name, then confirm your room.</p>
        </div>
        <input aria-label="Search by name" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search Latin or Chinese name" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
        <div className="max-h-[55vh] space-y-2 overflow-y-auto">
          {filtered.map(item => <button key={item.id} type="button" onClick={() => { setCandidate(item); setScreen('confirm'); setError('') }} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-indigo-400 hover:bg-indigo-50">
            <span className="block font-bold">{item.name_latin}</span>
            {item.name_chinese && <span className="block text-sm text-slate-600">{item.name_chinese}</span>}
            <span className={`mt-1 block text-xs font-semibold ${item.can_report ? 'text-emerald-700' : 'text-amber-700'}`}>{statusLabel[item.status]}{item.room_number ? ` • Room ${item.room_number}` : ''}</span>
          </button>)}
          {filtered.length === 0 && <p className="py-5 text-center text-sm text-slate-600">No matching names.</p>}
        </div>
      </section>}

      {!loading && screen === 'confirm' && candidate && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Confirm your details</h2>
        <dl className="space-y-3 text-sm">
          <div><dt className="text-slate-500">Latin name</dt><dd className="text-lg font-bold">{candidate.name_latin}</dd></div>
          {candidate.name_chinese && <div><dt className="text-slate-500">Chinese name</dt><dd className="text-lg font-bold">{candidate.name_chinese}</dd></div>}
          <div><dt className="text-slate-500">Dormitory room</dt><dd className="text-lg font-bold">{candidate.room_number ?? 'None'}</dd></div>
        </dl>
        {!candidate.can_report && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{statusLabel[candidate.status]}. Meal reporting is available only to current dormitory residents.</p>}
        <button type="button" disabled={!candidate.can_report} onClick={confirmPerson} className={`${button} bg-indigo-700 text-white hover:bg-indigo-800`}>Yes, this is me</button>
        <button type="button" onClick={() => setScreen('choose')} className={`${button} bg-slate-100 text-slate-800 hover:bg-slate-200`}>Choose another person</button>
      </section>}

      {!loading && screen === 'menu' && person && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div><p className="text-sm text-slate-600">Welcome,</p><h2 className="text-xl font-bold">{person.name_latin}</h2><p className="text-sm text-slate-600">Room {person.room_number}</p></div>
        <button type="button" onClick={() => setScreen('report')} className={`${button} bg-indigo-700 text-left text-white hover:bg-indigo-800`}>🍽️ Meal reporting <span className="block text-sm font-normal text-indigo-100">Breakfast and dinner</span></button>
        <div aria-disabled="true" className={`${button} bg-slate-100 text-slate-500`}>🕒 End of shift reporting <span className="block text-sm font-normal">Coming soon</span></div>
        <button type="button" onClick={signOut} className="w-full py-3 text-sm font-semibold text-slate-600 underline">Sign out / choose another person</button>
      </section>}

      {!loading && screen === 'report' && person && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <button type="button" onClick={() => setScreen('menu')} className="text-sm font-semibold text-indigo-700">← Functions</button>
        <div><h2 className="text-xl font-bold">Meal report</h2><p className="text-sm text-slate-600">{person.name_latin} • Room {person.room_number}</p></div>
        <label className="block text-sm font-semibold">Meal date
          <select value={date} onChange={event => setDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
            {dates.map(item => <option key={item.date} value={item.date}>{item.date}{item.can_submit ? '' : ' • View only'}</option>)}
          </select>
        </label>
        {reportLoading ? <p role="status">Loading report…</p> : <>
          <p className={`rounded-xl p-3 text-sm font-semibold ${hasReport ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{hasReport ? 'Reported • current choices below' : 'Not reported yet'}</p>
          {(['breakfast', 'dinner'] as const).map(meal => <label key={meal} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <span className="font-semibold capitalize">{meal}</span>
            <span className="flex items-center gap-3 text-sm"><span>{selection[meal] ? 'Eating' : 'Not eating'}</span><input type="checkbox" aria-label={`Eating ${meal}`} checked={selection[meal]} disabled={!day?.can_submit} onChange={event => { setSelection({ ...selection, [meal]: event.target.checked }); setMessage('') }} className="h-6 w-6 accent-indigo-700" /></span>
          </label>)}
          {day?.can_submit ? <><p className="text-xs text-slate-600">Submit before 17:00 Vietnam time on the previous day. Both “Not eating” choices still require submission.</p><button type="button" disabled={saving} onClick={() => void submit()} className={`${button} bg-indigo-700 text-white hover:bg-indigo-800`}>{saving ? 'Saving…' : hasReport ? 'Save changes' : 'Submit meal report'}</button></> : <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">View only. Deadline passed or meals are not served this day. Contact HR for changes.</p>}
        </>}
      </section>}
    </div>
  </main>
}
