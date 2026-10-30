import { useEffect, useState } from 'react'
import { getDates, getPeople, getReport, saveReport } from './api'
import type { MealSelection, PublicPerson, ReportingDate } from './types'
import { EndShiftReporting } from '../end-shift-reporting/EndShiftReporting'
import { formatPortalDate, getPortalText, localizePortalError, readPortalLocale, savePortalLocale } from '../portal-localization'
import type { PortalLocale, PortalText } from '../portal-localization'

type Screen = 'choose' | 'confirm' | 'menu' | 'report' | 'end-shift'
const STORAGE_KEY = 'ny-meal-person-id'
const button = 'w-full rounded-2xl px-5 py-4 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export function MealReportingApp() {
  const [locale, setLocale] = useState<PortalLocale>(readPortalLocale)
  const text = getPortalText(locale)
  const statusLabel: Record<PublicPerson['status'], string> = {
    KTX: text.dormitory, HOTEL: text.hotel, ABROAD: text.returnedHome, UNASSIGNED: text.noRoom,
  }
  const [people, setPeople] = useState<PublicPerson[]>([])
  const [dates, setDates] = useState<ReportingDate[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [candidate, setCandidate] = useState<PublicPerson | null>(null)
  const [screen, setScreen] = useState<Screen>('choose')
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<PublicPerson[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<{ cause: unknown; fallback: keyof PortalText } | null>(null)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [date, setDate] = useState('')
  const [selection, setSelection] = useState<MealSelection>({ breakfast: false, dinner: false })
  const [hasReport, setHasReport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<keyof PortalText | null>(null)
  const [error, setError] = useState<{ cause: unknown; fallback: keyof PortalText } | null>(null)

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = locale === 'en' ? 'NY Employee Reporting' : 'NY 員工申報'
  }, [locale])

  function changeLocale(next: PortalLocale): void {
    savePortalLocale(next)
    setLocale(next)
  }

  useEffect(() => {
    let live = true
    Promise.all([getPeople(), getDates()]).then(([peopleResult, datesResult]) => {
      if (!live) return
      setPeople(peopleResult)
      setSuggestions(peopleResult)
      setDates(datesResult)
      setDate(datesResult[1]?.date ?? datesResult[0]?.date ?? '')
      const remembered = Number(localStorage.getItem(STORAGE_KEY))
      const person = peopleResult.find(item => item.id === remembered)
      if (person?.can_report) {
        setSelectedId(person.id)
        setScreen('menu')
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }).catch((cause: unknown) => {
      if (live) setError({ cause, fallback: 'loadPortalError' })
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (screen !== 'choose') return
    const query = search.trim()
    if (!query) {
      setSuggestions(people)
      setSearching(false)
      setSearchError(null)
      return
    }
    let live = true
    const timer = window.setTimeout(() => {
      setSearching(true)
      getPeople(query).then(result => {
        if (!live) return
        setSuggestions(result)
        setActiveSuggestion(0)
        setSearchError(null)
      }).catch((cause: unknown) => {
        if (live) setSearchError({ cause, fallback: 'searchError' })
      }).finally(() => { if (live) setSearching(false) })
    }, 250)
    return () => { live = false; window.clearTimeout(timer) }
  }, [search, screen, people])

  const person = people.find(item => item.id === selectedId) ?? null
  const day = dates.find(item => item.date === date)

  useEffect(() => {
    if (screen !== 'report' || selectedId === null || !date) return
    let live = true
    setReportLoading(true)
    setHasReport(false)
    setSelection({ breakfast: false, dinner: false })
    setError(null)
    setMessage(null)
    getReport(selectedId, date).then(result => {
      if (!live) return
      setHasReport(result.current !== null)
      setSelection(result.current ?? { breakfast: false, dinner: false })
    }).catch((cause: unknown) => {
      if (live) setError({ cause, fallback: 'loadReportError' })
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
    setMessage(null)
    setError(null)
  }

  async function submit() {
    if (!person || !date || !day?.can_submit || saving) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await saveReport(person.id, date, selection)
      setSelection(saved.current ?? selection)
      setHasReport(saved.current !== null)
      setMessage('mealSaved')
    } catch (cause: unknown) {
      setError({ cause, fallback: 'saveMealError' })
    } finally {
      setSaving(false)
    }
  }

  function choosePerson(item: PublicPerson) {
    setCandidate(item)
    setDropdownOpen(false)
    setScreen('confirm')
    setError(null)
  }

  function handleSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') setDropdownOpen(false)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setDropdownOpen(true)
      setActiveSuggestion(index => Math.min(index + 1, Math.max(0, suggestions.length - 1)))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestion(index => Math.max(index - 1, 0))
    }
    if (event.key === 'Enter' && dropdownOpen && suggestions[activeSuggestion]) {
      event.preventDefault()
      choosePerson(suggestions[activeSuggestion])
    }
  }

  return <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-900 sm:py-12">
    <div className="mx-auto max-w-lg space-y-6">
      <header className="rounded-3xl bg-indigo-950 px-6 py-7 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">{text.portal}</div>
          <label className="text-xs font-semibold text-indigo-100">{text.language}
            <select aria-label={text.language} value={locale} onChange={event => changeLocale(event.target.value as PortalLocale)} className="ml-2 rounded-lg border border-indigo-300 bg-indigo-900 px-2 py-1.5 text-white">
              <option value="zh-TW">繁體中文</option><option value="en">English</option>
            </select>
          </label>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{screen === 'end-shift' ? text.shiftReporting : text.employeeReporting}</h1>
        <p className="mt-2 text-sm text-indigo-100">{screen === 'end-shift' ? text.shiftDescription : text.portalDescription}</p>
      </header>

      {loading && <p className="rounded-2xl bg-white p-6 text-center" role="status">{text.loading}</p>}
      {error && <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{localizePortalError(error.cause, locale, error.fallback)}</div>}
      {message && <div role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{text[message]}</div>}

      {!loading && screen === 'choose' && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold">{text.findName}</h2>
          <p className="mt-1 text-sm text-slate-600">{text.findNameHelp}</p>
        </div>
        <div className="relative">
          <input aria-label={text.searchName} role="combobox" aria-autocomplete="list" aria-controls="person-suggestions" aria-expanded={dropdownOpen}
            value={search} onFocus={() => setDropdownOpen(true)} onKeyDown={handleSearchKey}
            onChange={event => { setSearch(event.target.value); setSuggestions([]); setSearching(Boolean(event.target.value.trim())); setActiveSuggestion(0); setDropdownOpen(true) }}
            placeholder={text.searchPlaceholder} autoComplete="off"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          {dropdownOpen && <div id="person-suggestions" role="listbox" aria-label={text.matchingNames}
            className="absolute inset-x-0 top-full z-20 mt-2 max-h-[45vh] space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            {searching && <p role="status" className="px-3 py-2 text-sm text-slate-600">{text.searching}</p>}
            {searchError && <p role="alert" className="px-3 py-2 text-sm text-rose-700">{localizePortalError(searchError.cause, locale, searchError.fallback)}</p>}
            {!searching && !searchError && suggestions.map((item, index) => <button key={item.id} type="button" role="option" aria-selected={index === activeSuggestion}
              onMouseDown={event => event.preventDefault()} onClick={() => choosePerson(item)}
              className={`w-full rounded-xl p-3 text-left hover:bg-indigo-50 ${index === activeSuggestion ? 'bg-indigo-50' : ''}`}>
              <span className="block font-bold">{item.name_latin}</span>
              {item.name_chinese && <span className="block text-sm text-slate-600">{item.name_chinese}</span>}
              <span className={`mt-1 block text-xs font-semibold ${item.can_report ? 'text-emerald-700' : 'text-amber-700'}`}>{statusLabel[item.status]}{item.room_number ? ` • ${text.room} ${item.room_number}` : ''}</span>
            </button>)}
            {!searching && !searchError && suggestions.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-600">{text.noNames}</p>}
          </div>}
        </div>
      </section>}

      {!loading && screen === 'confirm' && candidate && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">{text.confirmDetails}</h2>
        <dl className="space-y-3 text-sm">
          <div><dt className="text-slate-500">{text.latinName}</dt><dd className="text-lg font-bold">{candidate.name_latin}</dd></div>
          {candidate.name_chinese && <div><dt className="text-slate-500">{text.chineseName}</dt><dd className="text-lg font-bold">{candidate.name_chinese}</dd></div>}
          <div><dt className="text-slate-500">{text.dormitoryRoom}</dt><dd className="text-lg font-bold">{candidate.room_number ?? text.none}</dd></div>
        </dl>
        {!candidate.can_report && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{statusLabel[candidate.status]}. {text.dormitoryOnly}</p>}
        <button type="button" disabled={!candidate.can_report} onClick={confirmPerson} className={`${button} bg-indigo-700 text-white hover:bg-indigo-800`}>{text.confirmPerson}</button>
        <button type="button" onClick={() => setScreen('choose')} className={`${button} bg-slate-100 text-slate-800 hover:bg-slate-200`}>{text.chooseAnother}</button>
      </section>}

      {!loading && screen === 'menu' && person && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div><p className="text-sm text-slate-600">{text.welcome}</p><h2 className="text-xl font-bold">{person.name_latin}</h2><p className="text-sm text-slate-600">{text.room} {person.room_number}</p></div>
        <button type="button" onClick={() => setScreen('report')} className={`${button} bg-indigo-700 text-left text-white hover:bg-indigo-800`}>🍽️ {text.mealReporting} <span className="block text-sm font-normal text-indigo-100">{text.breakfastAndDinner}</span></button>
        <button type="button" onClick={() => setScreen('end-shift')} className={`${button} bg-indigo-700 text-left text-white hover:bg-indigo-800`}>🕒 {text.shiftReporting} <span className="block text-sm font-normal text-indigo-100">{text.shiftMenuDetail}</span></button>
        <button type="button" onClick={signOut} className="w-full py-3 text-sm font-semibold text-slate-600 underline">{text.signOut}</button>
      </section>}

      {!loading && screen === 'report' && person && <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <button type="button" onClick={() => setScreen('menu')} className="text-sm font-semibold text-indigo-700">← {text.functions}</button>
        <div><h2 className="text-xl font-bold">{text.mealReport}</h2><p className="text-sm text-slate-600">{person.name_latin} • {text.room} {person.room_number}</p></div>
        <label className="block text-sm font-semibold">{text.mealDate}
          <select value={date} onChange={event => setDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
            {dates.map(item => <option key={item.date} value={item.date}>{formatPortalDate(item.date, locale)}{item.can_submit ? '' : ` • ${text.viewOnly}`}</option>)}
          </select>
        </label>
        {reportLoading ? <p role="status">{text.loadingReport}</p> : <>
          <p className={`rounded-xl p-3 text-sm font-semibold ${hasReport ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{hasReport ? text.mealReported : text.notReported}</p>
          <p className="text-xs text-slate-600">{text.mealHelp}</p>
          {(['breakfast', 'dinner'] as const).map(meal => <label key={meal} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <span className="font-semibold">{text[meal]}</span>
            <input type="checkbox" aria-label={meal === 'breakfast' ? text.eatBreakfast : text.eatDinner} checked={selection[meal]} disabled={!day?.can_submit} onChange={event => { setSelection({ ...selection, [meal]: event.target.checked }); setMessage(null) }} className="h-6 w-6 accent-indigo-700" />
          </label>)}
          {day?.can_submit ? <><p className="text-xs text-slate-600">{text.mealDeadline}</p><button type="button" disabled={saving} onClick={() => void submit()} className={`${button} bg-indigo-700 text-white hover:bg-indigo-800`}>{saving ? text.saving : hasReport ? text.saveChanges : text.submitMeal}</button></> : <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{text.mealClosed}</p>}
        </>}
      </section>}
      {!loading && screen === 'end-shift' && person && <EndShiftReporting employeeId={person.id} name={person.name_latin} room={person.room_number} locale={locale} onBack={() => setScreen('menu')} />}
    </div>
  </main>
}
