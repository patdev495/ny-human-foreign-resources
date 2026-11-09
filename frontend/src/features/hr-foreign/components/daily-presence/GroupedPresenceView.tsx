import type { DailyPresenceGroup, DailyPresenceItem } from "../../types";
import type { PresenceAccommodation } from "./PresenceToolbar";

interface Props {
  activeSubTab: PresenceAccommodation;
  ktxGroups: DailyPresenceGroup[];
  hotelGroups: DailyPresenceGroup[];
  unassignedItems: DailyPresenceItem[];
  onOpenProfile: (employeeId: number) => void;
}

function PresencePerson({ item, onOpenProfile }: { item: DailyPresenceItem; onOpenProfile: (employeeId: number) => void }) {
  return <li className="px-4 py-3">
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <button type="button" onClick={() => onOpenProfile(item.employee_id)} className="min-w-0 cursor-pointer break-words text-left text-sm font-medium text-slate-900 underline-offset-4 hover:underline">{item.name_latin}{item.name_chinese && <span className="ml-2 font-normal text-slate-600">{item.name_chinese}</span>}</button>
      <span className="text-xs text-slate-600">{item.employee_code || `#${item.employee_id}`}</span>
    </div>
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
      <span>{item.department || "Chưa có bộ phận"}</span>
      {item.hotel_room_number && <span>Phòng {item.hotel_room_number}</span>}
      {item.bed_location && <span>{item.bed_location}</span>}
      {item.stay_type && <span>{item.stay_type === "CONG_TAC" ? "Công tác" : "Cố định"}</span>}
      {!item.room_number && !item.hotel_name && <span>SĐT: {item.phone || "—"}</span>}
    </p>
  </li>;
}

export function GroupedPresenceView({ activeSubTab, ktxGroups, hotelGroups, unassignedItems, onOpenProfile }: Props) {
  const sections: { key: "KTX" | "HOTEL"; title: string; groups: DailyPresenceGroup[] }[] = [
    { key: "KTX", title: "Phòng KTX", groups: ktxGroups },
    { key: "HOTEL", title: "Khách sạn", groups: hotelGroups },
  ];
  const visibleSections = sections.filter((section) => activeSubTab === "ALL" || activeSubTab === section.key);
  const showUnassigned = activeSubTab === "ALL" || activeSubTab === "UNASSIGNED";
  const count = visibleSections.reduce((sum, section) => sum + section.groups.reduce((total, group) => total + group.items.length, 0), 0) + (showUnassigned ? unassignedItems.length : 0);

  return <div className="min-w-0 space-y-5">
    {count === 0 ? <p className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Không tìm thấy nhân sự phù hợp với ngày tra cứu và bộ lọc.</p> : <>
      {visibleSections.filter((section) => section.groups.length > 0).map((section) => <section key={section.key} className="space-y-3" aria-label={section.title}>
        <h2 className="text-base font-semibold text-slate-900">{section.title} <span className="text-sm font-normal text-slate-600">({section.groups.length} {section.key === "KTX" ? "phòng" : "cơ sở"})</span></h2>
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {section.groups.map((group) => <section key={group.group_name} aria-label={section.key === "KTX" ? `Phòng ${group.group_name}` : group.group_name} className="min-w-0 rounded-sm border border-slate-200 bg-white">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="break-words text-sm font-semibold text-slate-900">{section.key === "KTX" ? `Phòng ${group.group_name}` : group.group_name}</h3>
              <span className="text-xs text-slate-600">{group.items.length} người</span>
            </div>
            <ul className="divide-y divide-slate-200">{group.items.map((item) => <PresencePerson key={item.employee_id} item={item} onOpenProfile={onOpenProfile} />)}</ul>
          </section>)}
        </div>
      </section>)}
      {showUnassigned && unassignedItems.length > 0 && <section className="space-y-3" aria-label="Nhân sự chưa xếp chỗ">
        <h2 className="text-base font-semibold text-amber-800">Chưa xếp chỗ ở <span className="text-sm font-normal">({unassignedItems.length} người)</span></h2>
        <ul className="divide-y divide-slate-200 rounded-sm border border-amber-200 bg-white">{unassignedItems.map((item) => <PresencePerson key={item.employee_id} item={item} onOpenProfile={onOpenProfile} />)}</ul>
      </section>}
    </>}
    <p role="status" className="text-sm text-slate-600">Hiển thị {count} nhân sự</p>
  </div>;
}
