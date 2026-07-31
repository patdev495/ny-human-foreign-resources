import React, { useEffect, useState } from "react";
import { fetchOdometerLogs, fetchVehicles, saveOdometerLog } from "../api";
import type { DailyOdometerLog, DailyOdometerLogCreatePayload, Vehicle } from "../types";

export const OdometerLogList: React.FC = () => {
  const [logs, setLogs] = useState<DailyOdometerLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("ALL");
  const [billingMonth, setBillingMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<DailyOdometerLogCreatePayload>({
    vehicle_id: 0,
    log_date: new Date().toISOString().split("T")[0],
    start_km: 0,
    end_km: 0,
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const vehicleList = await fetchVehicles("COMPANY_OWNED");
      const ducAnhVehicles = vehicleList.filter(
        (v) => v.license_plate && (v.license_plate.includes("98A") || v.license_plate.includes("99H"))
      );
      setVehicles(ducAnhVehicles.length > 0 ? ducAnhVehicles : vehicleList);

      const params: { vehicleId?: number; billingMonth?: string } = {};
      if (selectedVehicleId !== "ALL") {
        params.vehicleId = Number(selectedVehicleId);
      }
      if (billingMonth) {
        params.billingMonth = billingMonth;
      }

      const logList = await fetchOdometerLogs(params);
      setLogs(logList);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải dữ liệu odometer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedVehicleId, billingMonth]);

  const handleOpenAddModal = (vehicleId?: number) => {
    const defaultVehicleId = vehicleId || (vehicles.length > 0 ? vehicles[0].id : 0);
    setFormData({
      vehicle_id: defaultVehicleId,
      log_date: new Date().toISOString().split("T")[0],
      start_km: 0,
      end_km: 0,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleEditLog = (log: DailyOdometerLog) => {
    setFormData({
      vehicle_id: log.vehicle_id,
      log_date: log.log_date,
      start_km: log.start_km,
      end_km: log.end_km,
      notes: log.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id) {
      alert("Vui lòng chọn xe");
      return;
    }
    setSubmitting(true);
    try {
      await saveOdometerLog(formData);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert("Lỗi khi lưu chốt KM: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalKmMonth = logs.reduce((sum, l) => sum + (l.daily_km || 0), 0);
  const avgKmDay = logs.length > 0 ? Math.round(totalKmMonth / logs.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Nhật ký Quãng đường di chuyển (Chốt Km Theo Ngày)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Ghi nhận số Km đầu ngày và cuối ngày để chốt tổng Km chạy trong tháng cho xe khoán Đức Anh
          </p>
        </div>
        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2 bg-[#0052CC] hover:bg-[#0043A8] text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Chốt Km Đầu / Cuối Ngày
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Tổng KM Chạy Trong Kỳ</span>
            <div className="text-2xl font-extrabold text-blue-900 mt-1">
              {totalKmMonth.toLocaleString("vi-VN")} <span className="text-sm font-normal">km</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            Km
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Số Ngày Ghi Nhận Log</span>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1">
              {logs.length} <span className="text-sm font-normal">ngày</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
            #
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Trung Bình / Ngày</span>
            <div className="text-2xl font-extrabold text-purple-900 mt-1">
              {avgKmDay.toLocaleString("vi-VN")} <span className="text-sm font-normal">km/ngày</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
            ~
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Chọn Xe</label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">-- Tất cả xe --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.license_plate || "Chưa có biển"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tháng Chu Kỳ Đối Chiếu</label>
          <input
            type="month"
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-xs text-slate-400 ml-2">(26 tháng trước - 25 tháng này)</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Đang tải nhật ký quãng đường di chuyển...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-medium">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Chưa có bản ghi quãng đường di chuyển nào cho xe trong chu kỳ đã chọn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Ngày ghi nhận</th>
                  <th className="py-3 px-4">Phương tiện / Biển số</th>
                  <th className="py-3 px-4 text-right">Km Đầu Ngày</th>
                  <th className="py-3 px-4 text-right">Km Cuối Ngày</th>
                  <th className="py-3 px-4 text-right">Km Chạy Trong Ngày</th>
                  <th className="py-3 px-4">Ghi chú</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-medium">{index + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.log_date}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{log.vehicle_name}</div>
                      <div className="text-xs text-slate-400">{log.license_plate}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {log.start_km.toLocaleString("vi-VN")} km
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {log.end_km > 0 ? `${log.end_km.toLocaleString("vi-VN")} km` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {log.daily_km.toLocaleString("vi-VN")} km
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.notes || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleEditLog(log)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs underline"
                      >
                        Sửa Km
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">Chốt Số Km Quãng đường di chuyển</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phương Tiện</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value={0}>-- Chọn xe --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.license_plate || "Chưa có biển"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày Ghi Nhận</label>
                <input
                  type="date"
                  value={formData.log_date}
                  onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Km Đầu Ngày</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.start_km}
                    onChange={(e) => setFormData({ ...formData, start_km: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Km Cuối Ngày</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.end_km}
                    onChange={(e) => setFormData({ ...formData, end_km: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Km Chạy Tính Toán:</span>
                <span className="font-bold font-mono text-blue-700 text-base">
                  {Math.max(0, formData.end_km - formData.start_km).toLocaleString("vi-VN")} km
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú</label>
                <textarea
                  rows={2}
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Nhập ghi chú hoặc lý do chênh lệch (nếu có)..."
                  className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu Bản Ghi Odometer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
