import React, { useEffect, useState } from "react";
import {
  fetchMonthlyContracts,
  updateMonthlyContract,
  fetchVehicles,
  updateVehicle,
} from "../api";
import type { MonthlyVehicleContract, Vehicle } from "../types";
import { PdfViewerModal } from "./PdfViewerModal";
import { MonthlyContractEditModal } from "./contracts/MonthlyContractEditModal";
import { MonthlyVehicleEditModal } from "./contracts/MonthlyVehicleEditModal";
import { MonthlyInnovaContractCard } from "./contracts/MonthlyInnovaContractCard";
import { MonthlyTruckContractCard } from "./contracts/MonthlyTruckContractCard";

export const MonthlyContractList: React.FC = () => {
  const [contracts, setContracts] = useState<MonthlyVehicleContract[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Contract Edit Modal State
  const [editingContractPackage, setEditingContractPackage] = useState<{
    contract: MonthlyVehicleContract;
    linkedContractIds: number[];
  } | null>(null);
  const [submittingContract, setSubmittingContract] = useState<boolean>(false);

  // Vehicle Edit Modal State
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submittingVehicle, setSubmittingVehicle] = useState<boolean>(false);

  // PDF Viewer Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);
  const [pdfTitle, setPdfTitle] = useState<string>("");
  const [pdfDocKey, setPdfDocKey] = useState<string | null>(null);

  const handleOpenPdf = (title: string, docKey: string | null) => {
    setPdfTitle(title);
    setPdfDocKey(docKey);
    setPdfModalOpen(true);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contractsData, vehiclesData] = await Promise.all([
        fetchMonthlyContracts(),
        fetchVehicles("COMPANY_OWNED"),
      ]);
      setContracts(contractsData);
      setVehicles(vehiclesData);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải dữ liệu hợp đồng và danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContractPackage) return;
    setSubmittingContract(true);
    try {
      const { contract, linkedContractIds } = editingContractPackage;
      await Promise.all(
        linkedContractIds.map((id) => updateMonthlyContract(id, contract))
      );
      setEditingContractPackage(null);
      await loadData();
    } catch (err: any) {
      alert("Lỗi khi cập nhật bảng giá hợp đồng: " + err.message);
    } finally {
      setSubmittingContract(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setSubmittingVehicle(true);
    try {
      await updateVehicle(editingVehicle.id, {
        ownership_group: editingVehicle.ownership_group,
        name: editingVehicle.name,
        driver_name: editingVehicle.driver_name,
        license_plate: editingVehicle.license_plate,
        driver_phone: editingVehicle.driver_phone,
        default_cost: editingVehicle.default_cost,
        is_active: editingVehicle.is_active,
      });
      setEditingVehicle(null);
      await loadData();
    } catch (err: any) {
      alert("Lỗi khi cập nhật thông tin xe / lái xe: " + err.message);
    } finally {
      setSubmittingVehicle(false);
    }
  };

  // Group contracts and vehicles
  const sevenSeaterContracts = contracts.filter(
    (c) => c.contract_name.includes("7 chỗ") || (c.vehicle_name && c.vehicle_name.includes("7 chỗ"))
  );
  const sevenSeaterVehicles = vehicles.filter(
    (v) => (v.name && v.name.includes("7 chỗ")) || (v.name && v.name.includes("Innova"))
  );

  const truckContracts = contracts.filter(
    (c) => c.contract_name.includes("tải") || (c.vehicle_name && c.vehicle_name.includes("tải"))
  );
  const truckVehicles = vehicles.filter(
    (v) => (v.name && v.name.includes("tải")) || (v.name && v.name.includes("CNHTC"))
  );

  const main7SeaterContract = sevenSeaterContracts[0] || contracts[0];
  const mainTruckContract = truckContracts[0] || contracts.find((c) => c.id !== main7SeaterContract?.id);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="p-8 text-center text-slate-500 font-medium">Đang tải cấu hình hợp đồng xe công ty...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 font-medium">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {main7SeaterContract && (
            <MonthlyInnovaContractCard
              mainInnovaContract={main7SeaterContract}
              innovaContracts={sevenSeaterContracts}
              innovaVehicles={sevenSeaterVehicles}
              onEditContract={(contract, linkedIds) => setEditingContractPackage({ contract, linkedContractIds: linkedIds })}
              onEditVehicle={(vehicle) => setEditingVehicle(vehicle)}
              onViewPdf={handleOpenPdf}
            />
          )}

          {mainTruckContract && (
            <MonthlyTruckContractCard
              mainTruckContract={mainTruckContract}
              truckVehicles={truckVehicles}
              onEditContract={(contract, linkedIds) => setEditingContractPackage({ contract, linkedContractIds: linkedIds })}
              onEditVehicle={(vehicle) => setEditingVehicle(vehicle)}
              onViewPdf={handleOpenPdf}
            />
          )}
        </div>
      )}

      {/* Modal 1: Sửa Bảng Giá Hợp Đồng */}
      <MonthlyContractEditModal
        editingContractPackage={editingContractPackage}
        setEditingContractPackage={setEditingContractPackage}
        onSave={handleSaveContract}
        submitting={submittingContract}
      />

      {/* Modal 2: Sửa Thông Tin Xe & Lái Xe */}
      <MonthlyVehicleEditModal
        editingVehicle={editingVehicle}
        setEditingVehicle={setEditingVehicle}
        onSave={handleSaveVehicle}
        submitting={submittingVehicle}
      />

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModalOpen}
        title={pdfTitle}
        docKey={pdfDocKey}
        onClose={() => setPdfModalOpen(false)}
      />
    </div>
  );
};
