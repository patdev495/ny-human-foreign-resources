import { groupLabels, type GroupedPerson } from "./endShiftView";

export function EndShiftPeople({ people, total, date }: { people: GroupedPerson[]; total: number; date: string }) {
  return <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
    <div className="lg:hidden">
      {people.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-500">Không có nhân sự phù hợp.</p> : <ul className="divide-y divide-slate-200">
        {people.map(person => <li key={person.employee_id} className="space-y-2 px-3 py-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="break-words font-medium text-slate-900">{person.name_latin}</p>{person.name_chinese && <p className="mt-1 break-words text-slate-500">{person.name_chinese}</p>}</div>
            <p className="max-w-24 shrink-0 break-words text-right text-slate-600">Phòng {person.room_number || "—"}</p>
          </div>
          <p className={person.group === "NOT_REPORTED" ? "text-amber-800" : "text-slate-700"}>{groupLabels[person.group]}</p>
        </li>)}
      </ul>}
    </div>
    <div role="region" aria-label="Danh sách nhu cầu xe tan làm" tabIndex={0} className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[650px] text-left text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50"><tr>{["STT", "Họ tên", "Tên tiếng Trung", "Phòng KTX", "Khai báo tan làm"].map(title => <th key={title} scope="col" className="px-4 py-3 font-medium">{title}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-200">
          {people.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Không có nhân sự phù hợp.</td></tr>}
          {people.map((person, index) => <tr key={person.employee_id} className="hover:bg-slate-50">
            <td className="px-4 py-3 tabular-nums text-slate-500">{index + 1}</td><td className="px-4 py-3 font-medium text-slate-900">{person.name_latin}</td>
            <td className="px-4 py-3">{person.name_chinese || "—"}</td><td className="px-4 py-3">{person.room_number || "—"}</td>
            <td className={`px-4 py-3 ${person.group === "NOT_REPORTED" ? "text-amber-800" : ""}`}>{groupLabels[person.group]}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-3 py-3 text-sm text-slate-500 sm:px-4">Hiển thị {people.length} / {total} nhân sự · {date.split("-").reverse().join("/")}</p>
  </div>;
}
