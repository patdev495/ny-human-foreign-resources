import type { Stay } from "../types";

export type TravelExitAction = "CHECK_OUT" | "KEEP_ROOM_ABSENCE";

interface Props {
  stay: Stay;
  value: TravelExitAction;
  disabled?: boolean;
  onChange: (value: TravelExitAction) => void;
}

export function TravelExitRoomAction({ stay, value, disabled = false, onChange }: Props) {
  return <fieldset disabled={disabled} className="space-y-2.5 border-t border-slate-100 pt-3 disabled:opacity-60">
    <legend className="pt-3 text-xs font-bold text-slate-800">
      Xử lý chỗ ở hiện tại ({stay.accommodation_type === "KTX" ? `KTX Phòng ${stay.room_number || ""}` : "Khách sạn"})
    </legend>
    {disabled && <p className="text-[11px] text-amber-700">Chỉ áp dụng khi nhập ngày thực tế đã về nước.</p>}
    {([
      ["CHECK_OUT", "Trả phòng & chuyển trạng thái Đã về nước", "Kết thúc lượt ở hiện tại và giải phóng chỗ ở."],
      ["KEEP_ROOM_ABSENCE", "Giữ phòng, chỉ báo vắng mặt", "Giữ chỗ ở cho lượt sang tới. Nhân viên đã về nước không thuộc diện báo cơm."],
    ] as const).map(([action, title, description]) => <label key={action}
      className={`flex items-start gap-3 rounded-xl border p-3 ${value === action && !disabled ? "border-blue-600 bg-blue-50/60" : "border-slate-200 bg-slate-50/50"} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
      <input type="radio" name="travel_exit_action" checked={value === action} onChange={() => onChange(action)} className="mt-0.5" />
      <span><span className="block text-xs font-bold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-[11px] text-slate-500">{description}</span></span>
    </label>)}
  </fieldset>;
}
