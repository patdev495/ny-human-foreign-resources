import type { ResidentInfo, RoomOccupancy } from "../../types";
import { systemTextButton } from "../../../../shared/components/systemStyles";

interface Props {
  filteredOccupancy: RoomOccupancy[];
  onCheckOut: (res: ResidentInfo, unitName: string) => void;
}

const roomNumberCollator = new Intl.Collator("vi", { numeric: true, sensitivity: "base" });

export function GroupedRoomOccupancyView({ filteredOccupancy, onCheckOut }: Props) {
  if (filteredOccupancy.length === 0) return <div className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Không có phòng hoặc khách sạn phù hợp.</div>;
  const orderedOccupancy = [...filteredOccupancy].sort((first, second) => {
    if (first.accommodation_type !== second.accommodation_type) return first.accommodation_type === "KTX" ? -1 : 1;
    return roomNumberCollator.compare(first.room_number || first.unit_name, second.room_number || second.unit_name);
  });

  return <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2">
    {orderedOccupancy.map((room) => {
      const isHotel = room.accommodation_type === "HOTEL";
      const title = isHotel ? room.unit_name : `Phòng ${room.unit_name}`;
      const remaining = room.capacity == null ? null : room.capacity - room.active_count - room.scheduled_count;
      const residents = [
        ...room.active_residents.map((resident) => ({ resident, scheduled: false })),
        ...room.scheduled_residents.map((resident) => ({ resident, scheduled: true })),
      ];
      return <section key={`${room.accommodation_type}-${room.unit_id}`} aria-label={title} className="min-w-0 rounded-sm border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <h2 className="break-words text-sm font-semibold text-slate-900">{title}</h2>
            {isHotel && room.address && <p className="mt-1 break-words text-xs text-slate-600">{room.address}</p>}
          </div>
          <span className="text-xs text-slate-600">{room.active_count} đang ở · {room.scheduled_count} sắp đến</span>
        </div>
        {!isHotel && <p className={`border-b border-slate-200 px-4 py-2 text-xs ${remaining !== null && remaining < 0 ? "text-red-700" : "text-slate-600"}`}>
          {remaining === null ? "Chưa khai báo sức chứa" : remaining < 0 ? `${room.active_count + room.scheduled_count}/${room.capacity} đã xếp · Vượt sức chứa ${-remaining}` : `Sức chứa ${room.capacity} người · Còn ${remaining} chỗ chưa xếp`}
        </p>}
        {residents.length === 0 ? <p className="px-4 py-6 text-sm text-slate-600">Chưa có người phù hợp.</p>
          : <ul className="divide-y divide-slate-200">
            {residents.map(({ resident, scheduled }) => <li key={resident.stay_id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-slate-900">{resident.name_latin}{resident.name_chinese && <span className="ml-2 font-normal text-slate-600">{resident.name_chinese}</span>}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span>{resident.bed_location || "Chưa ghi vị trí giường"}</span>
                  <span>{scheduled ? "Dự kiến vào" : "Ngày vào"}: {resident.start_date || "—"}</span>
                  <span>{resident.stay_type === "CONG_TAC" ? "Công tác" : "Cố định"}</span>
                </p>
              </div>
              {scheduled ? <span className="shrink-0 text-sm text-slate-600">Sắp đến</span>
                : <button type="button" onClick={() => onCheckOut(resident, title)} aria-label={`Trả phòng cho ${resident.name_latin}`} className={`${systemTextButton} shrink-0`}>Trả phòng</button>}
            </li>)}
          </ul>}
      </section>;
    })}
  </div>;
}
