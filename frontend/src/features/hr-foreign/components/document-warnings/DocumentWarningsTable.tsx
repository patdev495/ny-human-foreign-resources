import { getVisaLabel, type ExpiringDocumentItem, type ProfileTab } from "../../types";
import { systemTextButton } from "../../../../shared/components/systemStyles";
import { documentWarningStatus, documentWarningText, warningDocuments } from "./warningUtils";

interface Props {
  items: ExpiringDocumentItem[];
  onOpenProfile: (employeeId: number, tab: ProfileTab) => void;
}

export function DocumentWarningsTable({ items, onOpenProfile }: Props) {
  return <section className="min-w-0 rounded-sm border border-slate-200 bg-white" aria-label="Danh sách cảnh báo giấy tờ">
    <div className="overflow-x-auto" role="region" aria-label="Bảng cảnh báo giấy tờ" tabIndex={0}>
      <table className="w-full min-w-[1020px] border-collapse text-left text-sm">
        <caption className="sr-only">Giấy tờ hết hạn, sắp hết hạn hoặc thiếu thông tin</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr>
          {["Nhân sự", "Hộ chiếu", "Giấy tờ", "Số / Loại giấy tờ", "Ngày hết hạn", "Trạng thái", "Thao tác"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-200">
          {items.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">Không có cảnh báo giấy tờ phù hợp.</td></tr>
            : items.map((item, index) => {
              const document = warningDocuments.find((entry) => entry.type === item.doc_type);
              const status = documentWarningStatus(item);
              const color = status === "EXPIRED" ? "text-red-700" : "text-amber-800";
              const description = item.doc_type === "VISA" ? getVisaLabel(item.type_name) : item.doc_type === "PASSPORT" ? item.passport_number : item.type_name;
              const openProfile = (): void => onOpenProfile(item.employee_id, document?.tab ?? "VISA_TAM_TRU");
              return <tr key={`${item.doc_type}-${item.employee_id}-${item.id ?? index}`} className="hover:bg-slate-50">
                <th scope="row" className="min-w-40 px-3 py-3 font-normal"><button type="button" onClick={openProfile} className="cursor-pointer break-words text-left font-medium text-slate-900 underline-offset-4 hover:underline">{item.employee_name}</button></th>
                <td className="px-3 py-3 text-slate-600">{item.passport_number || "—"}</td>
                <td className="px-3 py-3 text-slate-700">{document?.label || item.doc_type}</td>
                <td className="max-w-sm break-words px-3 py-3 text-slate-600">{description || "—"}{item.missing_reason && <span className="mt-1 block text-xs text-amber-800">{item.missing_reason}</span>}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{item.expiry_date || "—"}</td>
                <td className={`whitespace-nowrap px-3 py-3 ${color}`}>{documentWarningText(item)}</td>
                <td className="whitespace-nowrap px-3 py-2"><button type="button" onClick={openProfile} aria-label={`Mở hồ sơ ${item.employee_name}, ${document?.label || item.doc_type}`} className={systemTextButton}>Mở hồ sơ</button></td>
              </tr>;
            })}
        </tbody>
      </table>
    </div>
    <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">Hiển thị {items.length} cảnh báo giấy tờ</p>
  </section>;
}
