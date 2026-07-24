import React from "react";
import type { ForeignEmployee, ResidentInfo, RoomOccupancy } from "../../types";

interface Props {
  filteredOccupancy: RoomOccupancy[];
  employees: ForeignEmployee[];
  onCheckOut: (res: ResidentInfo, unitName: string) => void;
}

export const FlatResidentTableView: React.FC<Props> = ({
  filteredOccupancy,
  employees,
  onCheckOut,
}) => {
  const allResidentsWithUnit = filteredOccupancy.flatMap((unit) => {
    const isHotel = unit.accommodation_type === "HOTEL";
    const unitTitle = isHotel ? unit.unit_name : `Phòng ${unit.unit_name}`;
    return unit.active_residents.map((res) => ({
      ...res,
      unitTitle,
      accommodation_type: unit.accommodation_type,
    }));
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">STT</th>
              <th className="py-3.5 px-4">Mã NV</th>
              <th className="py-3.5 px-4">Họ và tên</th>
              <th className="py-3.5 px-4">Số hộ chiếu</th>
              <th className="py-3.5 px-4">Bộ phận</th>
              <th className="py-3.5 px-4">Loại chỗ ở</th>
              <th className="py-3.5 px-4">Tên phòng / Khách sạn</th>
              <th className="py-3.5 px-4">Vị trí giường</th>
              <th className="py-3.5 px-4">Loại hình</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {allResidentsWithUnit.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                  Không tìm thấy nhân sự đang lưu trú nào phù hợp.
                </td>
              </tr>
            ) : (
              allResidentsWithUnit.map((res, idx) => {
                const emp = employees.find((e) => e.id === res.employee_id);
                return (
                  <tr key={`${res.stay_id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {emp?.employee_code || `#${res.employee_id}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{res.name_latin}</span>
                      {res.name_chinese && (
                        <p className="text-[11px] text-slate-400 font-normal">{res.name_chinese}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {res.passport_number || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{emp?.department || "—"}</td>
                    <td className="py-3 px-4">
                      {res.accommodation_type === "KTX" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          🏫 KTX
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          🏨 Khách sạn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{res.unitTitle}</td>
                    <td className="py-3 px-4 text-slate-600">{res.bed_location || "—"}</td>
                    <td className="py-3 px-4">
                      {res.stay_type === "CONG_TAC" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                          Công tác
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Cố định
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onCheckOut(res, res.unitTitle)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        Trả phòng
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
