export type PortalLocale = 'zh-TW' | 'en'

const STORAGE_KEY = 'ny-portal-language'

const english = {
  portal: 'NY • Employee portal',
  employeeReporting: 'Employee reporting',
  shiftReporting: 'End of shift reporting',
  portalDescription: 'Meals and end of shift at the dormitory',
  shiftDescription: 'Your end of shift choice for the work day',
  language: 'Language',
  loading: 'Loading…',
  findName: 'Find your name',
  findNameHelp: 'Select your name, then confirm your room.',
  searchName: 'Search by name',
  searchPlaceholder: 'Search Latin or Chinese name',
  matchingNames: 'Matching names',
  searching: 'Searching…',
  noNames: 'No matching names.',
  dormitory: 'Dormitory',
  hotel: 'Hotel',
  returnedHome: 'Returned home',
  noRoom: 'No dormitory room',
  room: 'Room',
  confirmDetails: 'Confirm your details',
  latinName: 'Latin name',
  chineseName: 'Chinese name',
  dormitoryRoom: 'Dormitory room',
  none: 'None',
  dormitoryOnly: 'Meal reporting is available only to current dormitory residents.',
  confirmPerson: 'Yes, this is me',
  chooseAnother: 'Choose another person',
  welcome: 'Welcome,',
  mealReporting: 'Meal reporting',
  breakfastAndDinner: 'Breakfast and dinner',
  shiftMenuDetail: '17:30, 20:00 or self travel',
  signOut: 'Sign out / choose another person',
  functions: 'Functions',
  mealReport: 'Meal report',
  mealDate: 'Meal date',
  viewOnly: 'View only',
  loadingReport: 'Loading report…',
  mealReported: 'Reported • current choices below',
  shiftReported: 'Reported • current choice below',
  notReported: 'Not reported yet',
  mealHelp: 'Tick a box if you will eat that meal. Leave it unticked if you will not eat.',
  breakfast: 'Breakfast',
  dinner: 'Dinner',
  eatBreakfast: 'Eat breakfast',
  eatDinner: 'Eat dinner',
  mealDeadline: 'Submit before 17:00 Vietnam time on the previous day, even when both boxes are unticked.',
  saving: 'Saving…',
  saveChanges: 'Save changes',
  submitMeal: 'Submit meal report',
  mealClosed: 'View only. Deadline passed or meals are not served this day. Contact HR for changes.',
  mealSaved: 'Meal report saved. HR can see your latest choices.',
  workDate: 'Work date',
  loadingDates: 'Loading dates…',
  shiftChoice: 'End of shift choice',
  selfTravel: 'Self travel • no car needed',
  pickupLocation: 'Pickup location',
  selectPickup: 'Select pickup location',
  destination: 'Destination',
  shiftDeadline: 'Submit or change before 17:00 Vietnam time on this work date.',
  submitShift: 'Submit report',
  shiftClosed: 'View only. The 17:00 deadline has passed for this date.',
  shiftSaved: 'End of shift report saved. HR can see your latest choice.',
  loadPortalError: 'Could not load the portal.',
  searchError: 'Could not search names.',
  loadReportError: 'Could not load report.',
  saveMealError: 'Could not save report. Please try again.',
  loadDatesError: 'Could not load dates.',
  saveShiftError: 'Could not save report.',
  unknownError: 'Something went wrong. Please try again.',
  personNotFound: 'Person not found',
  mealViewForbidden: 'Only current dormitory residents can view meal reports',
  mealReportForbidden: 'Only current dormitory residents can report meals',
  shiftViewForbidden: 'Only current dormitory residents can view end of shift reports',
  shiftReportForbidden: 'Only current dormitory residents can report end of shift',
  reportingClosed: 'Reporting closed for this date. Contact HR.',
  pickupRequired: 'Pickup location is required',
  selfTravelPickup: 'Self travel must not have a pickup location',
} as const

export type PortalText = { [Key in keyof typeof english]: string }

const traditionalChinese: PortalText = {
  portal: 'NY • 員工入口網站',
  employeeReporting: '員工申報',
  shiftReporting: '下班時間申報',
  portalDescription: '宿舍用餐與下班時間申報',
  shiftDescription: '申報工作日的下班安排',
  language: '語言',
  loading: '載入中…',
  findName: '尋找您的姓名',
  findNameHelp: '選擇姓名後，請確認房間號碼。',
  searchName: '依姓名搜尋',
  searchPlaceholder: '搜尋拉丁字母或中文姓名',
  matchingNames: '符合的姓名',
  searching: '搜尋中…',
  noNames: '找不到符合的姓名。',
  dormitory: '宿舍',
  hotel: '飯店',
  returnedHome: '已返國',
  noRoom: '尚未分配宿舍房間',
  room: '房間',
  confirmDetails: '確認您的資料',
  latinName: '拉丁字母姓名',
  chineseName: '中文姓名',
  dormitoryRoom: '宿舍房間',
  none: '無',
  dormitoryOnly: '只有目前住在宿舍的員工可以申報用餐。',
  confirmPerson: '是的，這是我',
  chooseAnother: '選擇其他員工',
  welcome: '歡迎，',
  mealReporting: '用餐申報',
  breakfastAndDinner: '早餐與晚餐',
  shiftMenuDetail: '17:30、20:00 或自行前往',
  signOut: '登出／選擇其他員工',
  functions: '功能選單',
  mealReport: '用餐申報',
  mealDate: '用餐日期',
  viewOnly: '僅供檢視',
  loadingReport: '正在載入申報…',
  mealReported: '已申報 • 目前選擇如下',
  shiftReported: '已申報 • 目前選擇如下',
  notReported: '尚未申報',
  mealHelp: '若要用餐，請勾選該餐；若不吃，請保持未勾選。',
  breakfast: '早餐',
  dinner: '晚餐',
  eatBreakfast: '吃早餐',
  eatDinner: '吃晚餐',
  mealDeadline: '請於用餐前一天越南時間 17:00 前送出，即使兩餐都不吃也須申報。',
  saving: '儲存中…',
  saveChanges: '儲存變更',
  submitMeal: '送出用餐申報',
  mealClosed: '僅供檢視。申報期限已過或當日不供餐。如需變更，請聯絡人事部門。',
  mealSaved: '用餐申報已儲存。人事部門可查看您最新的選擇。',
  workDate: '工作日期',
  loadingDates: '正在載入日期…',
  shiftChoice: '下班安排',
  selfTravel: '自行前往 • 不需要派車',
  pickupLocation: '上車地點',
  selectPickup: '選擇上車地點',
  destination: '目的地',
  shiftDeadline: '請於該工作日越南時間 17:00 前送出或修改。',
  submitShift: '送出申報',
  shiftClosed: '僅供檢視。該日期的 17:00 申報期限已過。',
  shiftSaved: '下班時間申報已儲存。人事部門可查看您最新的選擇。',
  loadPortalError: '無法載入入口網站。',
  searchError: '無法搜尋姓名。',
  loadReportError: '無法載入申報。',
  saveMealError: '無法儲存申報，請再試一次。',
  loadDatesError: '無法載入日期。',
  saveShiftError: '無法儲存申報。',
  unknownError: '發生錯誤，請再試一次。',
  personNotFound: '找不到該員工',
  mealViewForbidden: '只有目前住在宿舍的員工可以查看用餐申報',
  mealReportForbidden: '只有目前住在宿舍的員工可以申報用餐',
  shiftViewForbidden: '只有目前住在宿舍的員工可以查看下班時間申報',
  shiftReportForbidden: '只有目前住在宿舍的員工可以申報下班時間',
  reportingClosed: '該日期已截止申報，請聯絡人事部門。',
  pickupRequired: '必須選擇上車地點',
  selfTravelPickup: '自行前往時不應填寫上車地點',
}

export function getPortalText(locale: PortalLocale): PortalText {
  return locale === 'en' ? english : traditionalChinese
}

export function readPortalLocale(): PortalLocale {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh-TW'
  } catch {
    return 'zh-TW'
  }
}

export function savePortalLocale(locale: PortalLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // The chosen language remains active for this page when storage is unavailable.
  }
}

export function formatPortalDate(date: string, locale: PortalLocale): string {
  const value = new Date(`${date}T00:00:00Z`)
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(value)
  const displayDate = locale === 'en' ? date : new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC',
  }).format(value)
  return `${weekday}, ${displayDate}`
}

const apiErrorKeys: Record<string, keyof PortalText> = {
  'Person not found': 'personNotFound',
  'Only current dormitory residents can view meal reports': 'mealViewForbidden',
  'Only current dormitory residents can report meals': 'mealReportForbidden',
  'Only current dormitory residents can view end of shift reports': 'shiftViewForbidden',
  'Only current dormitory residents can report end of shift': 'shiftReportForbidden',
  'Reporting closed for this date. Contact HR.': 'reportingClosed',
  'Pickup location is required': 'pickupRequired',
  'Self travel must not have a pickup location': 'selfTravelPickup',
}

export function localizePortalError(cause: unknown, locale: PortalLocale, fallback: keyof PortalText): string {
  const text = getPortalText(locale)
  if (!(cause instanceof Error)) return text[fallback]
  const key = apiErrorKeys[cause.message]
  if (key) return text[key]
  if (cause.message.startsWith('Request failed (')) return text[fallback]
  return locale === 'en' ? cause.message : text[fallback]
}
