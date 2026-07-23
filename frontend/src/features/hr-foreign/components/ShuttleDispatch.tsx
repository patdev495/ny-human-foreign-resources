import React, { useState } from "react";

interface ShuttleBooking {
  id: number;
  employee_name: string;
  department: string;
  route: string;
  pickup_time: string;
  passengers_count: number;
  driver_name: string;
  license_plate: string;
  status: "CONFIRMED" | "PENDING" | "COMPLETED";
}

export const ShuttleDispatch: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"SCHEDULE" | "REQUESTS">("SCHEDULE");

  const sampleBookings: ShuttleBooking[] = [
    {
      id: 1,
      employee_name: "WANG LEI (王伟)",
      department: "Phòng Kỹ thuật",
      route: "Đón từ Sân bay Nội Bài ➔ KTX Nhà máy NY",
      pickup_time: "08:30 - 24/07/2026",
      passengers_count: 2,
      driver_name: "Nguyễn Văn Hùng",
      license_plate: "29B-123.45",
      status: "CONFIRMED",
    },
    {
      id: 2,
      employee_name: "ZHANG WEI (张伟)",
      department: "Đội Chuyên gia Chỗ ở",
      route: "KTX Nhà máy ➔ Khách sạn Mường Thanh",
      pickup_time: "17:30 - 24/07/2026",
      passengers_count: 4,
      driver_name: "Trần Văn Bình",
      license_plate: "29A-678.90",
      status: "PENDING",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">🚐</span>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý & Điều xe Đưa đón</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lịch trình điều xe đón tiễn Sân bay, đưa đón chuyên gia & nhân sự nước ngoài công tác.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer">
            <span>➕</span> Đăng ký Điều xe mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab("SCHEDULE")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeSubTab === "SCHEDULE"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          📅 Lịch trình Chuyến đi Đã đặt ({sampleBookings.length})
        </button>
        <button
          onClick={() => setActiveSubTab("REQUESTS")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeSubTab === "REQUESTS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          📋 Yêu cầu Đưa đón Cần duyệt (0)
        </button>
      </div>

      {/* Content area */}
      {activeSubTab === "SCHEDULE" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Danh sách Lịch điều xe Đưa đón</h3>
            <span className="text-xs text-slate-500">Cập nhật lúc 13:20:00</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">STT</th>
                  <th className="p-3">Nhân sự Yêu cầu</th>
                  <th className="p-3">Lộ trình Đưa đón</th>
                  <th className="p-3">Thời gian Đón</th>
                  <th className="p-3">Số khách</th>
                  <th className="p-3">Lái xe & Biển số</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleBookings.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{b.employee_name}</div>
                      <div className="text-[11px] text-slate-400">{b.department}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{b.route}</td>
                    <td className="p-3 font-semibold text-blue-700">{b.pickup_time}</td>
                    <td className="p-3 font-bold text-slate-700">{b.passengers_count} người</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{b.driver_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.license_plate}</div>
                    </td>
                    <td className="p-3">
                      {b.status === "CONFIRMED" ? (
                        <span className="px-2 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          ✓ Đã xác nhận
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
                          ⏳ Chờ điều xe
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "REQUESTS" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center space-y-3">
          <div className="text-3xl">📭</div>
          <h3 className="font-bold text-slate-700 text-base">Chưa có yêu cầu điều xe mới</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Các yêu cầu đưa đón nhân sự từ ứng dụng mobile hoặc form đăng ký sẽ hiển thị tại đây để đội xe phê duyệt.
          </p>
        </div>
      )}
    </div>
  );
};
