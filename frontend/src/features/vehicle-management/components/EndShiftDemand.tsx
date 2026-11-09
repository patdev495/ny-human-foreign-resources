import { useEffect, useState } from "react";
import { fetchEndShiftDemand, type DemandKey, type DemandView } from "../endShiftApi";
import { SystemTabs } from "../../../shared/components/SystemTabs";
import { systemField, systemSecondaryButton } from "../../../shared/components/systemStyles";
import { dispatchToday } from "./dispatch/dispatchForm";

const groupLabels: Record<DemandKey, string> = {
  CN09_1730: "CN09 · 17h30", CN09_2000: "CN09 · 20h00",
  CN15_1730: "CN15 · 17h30", CN15_2000: "CN15 · 20h00",
  SELF_TRAVEL: "Tự di chuyển", NOT_REPORTED: "Chưa báo giờ tan làm",
};
type GroupFilter = DemandKey | "ALL";

export function EndShiftDemand() {
  const [date, setDate] = useState(dispatchToday);
  const [demand, setDemand] = useState<DemandView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchEndShiftDemand(date).then(result => { if (active) setDemand(result); })
      .catch((failure: unknown) => { if (active) setError(failure instanceof Error ? failure.message : "Không thể tải khai báo tan làm."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, retry]);

  const current = !loading && !error && demand?.date === date ? demand : null;
  const groups = current?.groups || [];
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  const carCount = groups.filter(group => group.key !== "SELF_TRAVEL" && group.key !== "NOT_REPORTED").reduce((sum, group) => sum + group.count, 0);
  const query = search.trim().toLocaleLowerCase("vi-VN");
  const people = groups.filter(group => groupFilter === "ALL" || group.key === groupFilter)
    .flatMap(group => group.people.map(person => ({ ...person, group: group.key })))
    .filter(person => `${person.name_latin} ${person.name_chinese || ""} ${person.room_number || ""}`.toLocaleLowerCase("vi-VN").includes(query));

  return <section className="space-y-4">
    <div className="flex flex-wrap items-end gap-3 rounded-sm border border-slate-200 bg-white p-4">
      <label className="text-sm text-slate-700"><span className="mb-1 block">Ngày làm việc</span>
        <input type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} className={systemField} />
      </label>
      <button type="button" onClick={() => setDate(dispatchToday())} className={systemSecondaryButton}>Hôm nay</button>
      <label className="min-w-48 flex-1 text-sm text-slate-700"><span className="mb-1 block">Tìm nhân sự</span>
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tên hoặc phòng KTX…" className={systemField} />
      </label>
      <button type="button" disabled={loading} onClick={() => setRetry(value => value + 1)} className={systemSecondaryButton}>Làm mới</button>
    </div>
    <p className="text-sm text-slate-500">Giờ hiển thị là giờ tan làm. HR sắp xếp xe về KTX dựa trên khai báo của nhân viên.</p>
    {loading && <p role="status" className="py-6 text-sm text-slate-500">Đang tải khai báo tan làm…</p>}
    {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700"><span>{error}</span>
      <button type="button" onClick={() => setRetry(value => value + 1)} className={systemSecondaryButton}>Thử lại</button>
    </div>}
    {current && <>
      <p className="text-sm text-slate-600"><strong className="font-semibold text-slate-900">{carCount} người cần xe</strong> · Chưa báo giờ tan làm không tính vào nhu cầu xe.</p>
      <SystemTabs<GroupFilter> label="Nhóm nhu cầu xe tan làm" active={groupFilter} onChange={setGroupFilter}
        items={[{ key: "ALL", label: "Tất cả", count: total }, ...groups.map(group => ({ key: group.key, label: groupLabels[group.key], count: group.count }))]} />
      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
        <div role="region" aria-label="Danh sách nhu cầu xe tan làm" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50"><tr>{["STT", "Họ tên", "Tên tiếng Trung", "Phòng KTX", "Khai báo tan làm"].map(title => <th key={title} scope="col" className="px-4 py-3 font-medium">{title}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200">
              {people.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Không có nhân sự phù hợp.</td></tr>}
              {people.map((person, index) => <tr key={person.employee_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 tabular-nums text-slate-500">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{person.name_latin}</td>
                <td className="px-4 py-3">{person.name_chinese || "—"}</td>
                <td className="px-4 py-3">{person.room_number || "—"}</td>
                <td className={`px-4 py-3 ${person.group === "NOT_REPORTED" ? "text-amber-800" : ""}`}>{groupLabels[person.group]}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">Hiển thị {people.length} / {total} nhân sự · {date.split("-").reverse().join("/")}</p>
      </div>
    </>}
  </section>;
}
