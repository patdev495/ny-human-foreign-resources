import React, { useState, useEffect } from "react";
import type { ExpiringDocumentsResponse, ExpiringDocumentItem, ProfileTab } from "../types";

import { getVisaLabel } from "../types";
import { fetchExpiringDocuments, fetchDocWarningConfigs } from "../api";
import { DocWarningConfigModal } from "./DocWarningConfigModal";
import { EmployeeProfileModal } from "./EmployeeProfileModal";


interface DocWarningSectionCardProps {
  icon: string;
  title: string;
  docType: string;
  items: ExpiringDocumentItem[];
  thresholdText: string;
  badgeBg: string;
  badgeText: string;
  itemBorder: string;
  itemBg: string;
  itemText: string;
  onItemClick: (employeeId: number, tab: ProfileTab) => void;
}

const docTypeToTab = (docType: string): ProfileTab => {
  switch (docType) {
    case "VISA":
    case "TAM_TRU":
      return "VISA_TAM_TRU";
    case "GPLD":
      return "GPLD";
    case "CONTRACT":
      return "HOP_DONG";
    case "PASSPORT":
      return "PASSPORT";
    default:
      return "VISA_TAM_TRU";
  }
};

const DocWarningSectionCard: React.FC<DocWarningSectionCardProps> = ({
  icon,
  title,
  docType,
  items,
  thresholdText,
  badgeBg,
  badgeText,
  itemBorder,
  itemBg,
  itemText,
  onItemClick,
}) => {
  // Default expanded if count <= 3, otherwise collapsed for clean overview
  const [expanded, setExpanded] = useState(items.length > 0 && items.length <= 3);

  const count = items.length;

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{icon}</span>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          {count > 0 ? (
            <span className={`px-2.5 py-0.5 font-bold text-xs rounded-full ${badgeBg} ${badgeText}`}>
              {count} cảnh báo
            </span>
          ) : (
            <span className="px-2.5 py-0.5 font-semibold text-xs rounded-full bg-slate-100 text-slate-500">
              0 cảnh báo
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
            Mốc: Trong {thresholdText}
          </span>
          {count > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
            >
              <span>{expanded ? "Thu gọn 🔼" : "Xem chi tiết 👁️"}</span>
            </button>
          )}
        </div>
      </div>

      {count === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">Không có cảnh báo nào cần lưu ý.</p>
      ) : !expanded ? (
        <div className="py-2 flex items-center justify-between text-xs text-slate-500">
          <span className="italic">
            Đang ẩn {count} danh sách cảnh báo. Nhấn nút <strong>"Xem chi tiết"</strong> để xem.
          </span>
          <button
            onClick={() => setExpanded(true)}
            className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
          >
            Xem chi tiết
          </button>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
          {items.map((item, idx) => (
            <div
              key={`${docType}-${item.id || idx}`}
              onClick={() => onItemClick(item.employee_id, docTypeToTab(docType))}
              title="Bấm vào để mở hồ sơ nhân sự và chỉnh sửa"
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-xs transition-all group ${
                item.is_missing_info ? "border-red-300 bg-red-50/60 hover:bg-red-50" : `${itemBorder} ${itemBg}`
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <span>{item.employee_name}</span>
                  {item.passport_number && (
                    <span className="text-xs text-slate-500 font-mono">({item.passport_number})</span>
                  )}
                  <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-normal">
                    (Mở hồ sơ ↗)
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {item.is_missing_info ? (
                    <span className="text-red-700 font-medium">{item.missing_reason}</span>
                  ) : (
                    <>
                      {docType === "VISA" && (
                        <>
                          Visa loại: <span className="font-semibold">{getVisaLabel(item.type_name)}</span> &bull; Hết hạn:{" "}
                          <span className={`font-mono font-semibold ${itemText}`}>{item.expiry_date}</span>
                        </>
                      )}
                      {docType === "TAM_TRU" && (
                        <>
                          Giấy tờ: <span className="font-semibold">{item.type_name}</span> &bull; Hết hạn:{" "}
                          <span className={`font-mono font-semibold ${itemText}`}>{item.expiry_date}</span>
                        </>
                      )}
                      {docType === "GPLD" && (
                        <>
                          Số GPLĐ: <span className="font-semibold">{item.type_name}</span> &bull; Hết hạn:{" "}
                          <span className={`font-mono font-semibold ${itemText}`}>{item.expiry_date}</span>
                        </>
                      )}
                      {docType === "CONTRACT" && (
                        <>
                          Hợp đồng: <span className="font-semibold">{item.type_name}</span> &bull; Hết hạn:{" "}
                          <span className={`font-mono font-semibold ${itemText}`}>{item.expiry_date}</span>
                        </>
                      )}
                      {docType === "PASSPORT" && (
                        <>
                          Số HC: <span className="font-mono font-bold text-slate-900">{item.passport_number || "Chưa có"}</span> &bull; Hết hạn:{" "}
                          <span className={`font-mono font-semibold ${itemText}`}>{item.expiry_date}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {item.is_missing_info ? (
                  <span className="px-2 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-lg whitespace-nowrap">
                    ⚠️ Thiếu thông tin
                  </span>
                ) : (
                  <span className={`px-2 py-1 ${badgeBg} ${badgeText} font-bold text-xs rounded-lg whitespace-nowrap`}>
                    Còn {item.days_remaining} ngày
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ExpiringDocsAlert: React.FC = () => {
  const [data, setData] = useState<ExpiringDocumentsResponse | null>(null);
  const [configs, setConfigs] = useState<Record<string, { value: number; unit: string }>>({});
  const [loading, setLoading] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Profile modal state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<ProfileTab | undefined>(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, cfgRes] = await Promise.all([
        fetchExpiringDocuments(),
        fetchDocWarningConfigs(),
      ]);
      setData(docsRes);

      const cfgMap: Record<string, { value: number; unit: string }> = {};
      cfgRes.configs.forEach((item) => {
        cfgMap[item.doc_type] = {
          value: item.warning_value,
          unit: item.warning_unit === "MONTH" ? "tháng" : "ngày",
        };
      });
      setConfigs(cfgMap);
    } catch (err) {
      console.error("Failed to fetch expiring docs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalExpiring =
    (data?.expiring_visas.length || 0) +
    (data?.expiring_tam_trus.length || 0) +
    (data?.expiring_gpl_ds?.length || 0) +
    (data?.expiring_contracts?.length || 0) +
    (data?.expiring_passports?.length || 0);

  const formatThreshold = (docType: string) => {
    const cfg = configs[docType];
    if (!cfg) return "30 ngày";
    return `${cfg.value} ${cfg.unit}`;
  };

  const handleOpenProfile = (employeeId: number, tab: ProfileTab) => {
    setSelectedEmployeeId(employeeId);
    setSelectedTab(tab);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Cảnh báo Giấy tờ sắp Hết hạn & Thiếu thông tin (5 mục)
            {totalExpiring > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {totalExpiring} cần lưu ý
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cảnh báo các giấy tờ sắp hết hạn theo mốc đã cấu hình & thiếu thông tin. 💡 <em>Bấm vào nhân sự để mở hồ sơ chỉnh sửa ngay.</em>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <span>⚙️</span> Cấu hình mốc cảnh báo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang kiểm tra danh sách hết hạn...</div>
      ) : totalExpiring === 0 ? (
        <div className="py-10 text-center bg-emerald-50/50 rounded-xl border border-emerald-100 text-emerald-700 text-sm font-medium">
          Tất cả 5 loại giấy tờ pháp lý của nhân sự đều đầy đủ thông tin và còn hạn dài vượt mốc đã cấu hình.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. VISAS */}
          <DocWarningSectionCard
            icon="🛂"
            title="Visa / Thị thực"
            docType="VISA"
            items={data?.expiring_visas || []}
            thresholdText={formatThreshold("VISA")}
            badgeBg="bg-amber-100"
            badgeText="text-amber-800"
            itemBorder="border-amber-200"
            itemBg="bg-amber-50/40"
            itemText="text-amber-900"
            onItemClick={handleOpenProfile}
          />

          {/* 2. TAM TRUS */}
          <DocWarningSectionCard
            icon="🏠"
            title="Đăng ký Tạm trú"
            docType="TAM_TRU"
            items={data?.expiring_tam_trus || []}
            thresholdText={formatThreshold("TAM_TRU")}
            badgeBg="bg-rose-100"
            badgeText="text-rose-800"
            itemBorder="border-rose-200"
            itemBg="bg-rose-50/40"
            itemText="text-rose-900"
            onItemClick={handleOpenProfile}
          />

          {/* 3. GPLD */}
          <DocWarningSectionCard
            icon="💼"
            title="Giấy phép lao động (GPLĐ)"
            docType="GPLD"
            items={data?.expiring_gpl_ds || []}
            thresholdText={formatThreshold("GPLD")}
            badgeBg="bg-blue-100"
            badgeText="text-blue-800"
            itemBorder="border-blue-200"
            itemBg="bg-blue-50/40"
            itemText="text-blue-900"
            onItemClick={handleOpenProfile}
          />

          {/* 4. CONTRACTS */}
          <DocWarningSectionCard
            icon="📜"
            title="Hợp đồng lao động"
            docType="CONTRACT"
            items={data?.expiring_contracts || []}
            thresholdText={formatThreshold("CONTRACT")}
            badgeBg="bg-purple-100"
            badgeText="text-purple-800"
            itemBorder="border-purple-200"
            itemBg="bg-purple-50/40"
            itemText="text-purple-900"
            onItemClick={handleOpenProfile}
          />

          {/* 5. PASSPORTS */}
          <DocWarningSectionCard
            icon="📘"
            title="Hộ chiếu (Passport)"
            docType="PASSPORT"
            items={data?.expiring_passports || []}
            thresholdText={formatThreshold("PASSPORT")}
            badgeBg="bg-teal-100"
            badgeText="text-teal-800"
            itemBorder="border-teal-200"
            itemBg="bg-teal-50/40"
            itemText="text-teal-900"
            onItemClick={handleOpenProfile}
          />
        </div>
      )}

      <DocWarningConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={loadData}
      />

      {/* Employee 360 History & Edit Modal */}
      <EmployeeProfileModal
        employeeId={selectedEmployeeId}
        isOpen={isProfileModalOpen}
        initialTab={selectedTab}
        onClose={() => {
          setIsProfileModalOpen(false);
          loadData(); // refresh data after editing
        }}
      />
    </div>
  );
};
