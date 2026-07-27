import React, { useEffect, useState } from "react";
import {
  createDispatch,
  deleteDispatch,
  fetchDispatches,
  fetchVehicles,
  updateDispatch,
} from "../api";
import type {
  OwnershipGroup,
  Vehicle,
  VehicleDispatch,
  VehicleDispatchCreatePayload,
} from "../types";
import { DispatchFilterBar } from "./dispatch/DispatchFilterBar";
import { DispatchKpiBanner } from "./dispatch/DispatchKpiBanner";
import { DispatchModal } from "./dispatch/DispatchModal";
import { DispatchTable } from "./dispatch/DispatchTable";

export const VehicleDispatchList: React.FC = () => {
  const [dispatches, setDispatches] = useState<VehicleDispatch[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipGroup | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDispatch, setEditingDispatch] = useState<VehicleDispatch | null>(null);
  const [formData, setFormData] = useState<VehicleDispatchCreatePayload>({
    dispatch_date: new Date().toISOString().split("T")[0],
    vehicle_id: undefined,
    vehicle_name: "",
    ownership_group: "COMPANY_OWNED",
    driver_name: "",
    license_plate: "",
    pickup_location: "",
    dropoff_location: "",
    pickup_time: "08:00",
    passenger_name: "",
    passenger_count: 1,
    cost: 0,
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dispatchData, vehicleData] = await Promise.all([
        fetchDispatches({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          ownershipGroup: ownershipFilter === "ALL" ? undefined : ownershipFilter,
          search: searchQuery || undefined,
        }),
        fetchVehicles(),
      ]);
      setDispatches(dispatchData);
      setVehicles(vehicleData);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải nhật ký điều xe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fromDate, toDate, ownershipFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleVehicleSelect = (vehicleIdStr: string) => {
    if (!vehicleIdStr) return;
    const vId = parseInt(vehicleIdStr, 10);
    const selected = vehicles.find((v) => v.id === vId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        vehicle_id: selected.id,
        vehicle_name: selected.name,
        ownership_group: selected.ownership_group,
        driver_name: selected.driver_name || prev.driver_name,
        license_plate: selected.license_plate || prev.license_plate,
        cost: selected.default_cost || prev.cost,
      }));
    }
  };

  const handleOpenModal = (dispatch?: VehicleDispatch) => {
    if (dispatch) {
      setEditingDispatch(dispatch);
      setFormData({
        dispatch_date: dispatch.dispatch_date,
        vehicle_id: dispatch.vehicle_id || undefined,
        vehicle_name: dispatch.vehicle_name,
        ownership_group: dispatch.ownership_group,
        driver_name: dispatch.driver_name || "",
        license_plate: dispatch.license_plate || "",
        pickup_location: dispatch.pickup_location || "",
        dropoff_location: dispatch.dropoff_location || "",
        pickup_time: dispatch.pickup_time || "",
        passenger_name: dispatch.passenger_name || "",
        passenger_count: dispatch.passenger_count || 1,
        cost: dispatch.cost || 0,
        notes: dispatch.notes || "",
      });
    } else {
      setEditingDispatch(null);
      const defaultVehicle = vehicles[0];
      setFormData({
        dispatch_date: new Date().toISOString().split("T")[0],
        vehicle_id: defaultVehicle ? defaultVehicle.id : undefined,
        vehicle_name: defaultVehicle ? defaultVehicle.name : "",
        ownership_group: defaultVehicle ? defaultVehicle.ownership_group : "COMPANY_OWNED",
        driver_name: defaultVehicle ? defaultVehicle.driver_name || "" : "",
        license_plate: defaultVehicle ? defaultVehicle.license_plate || "" : "",
        pickup_location: "",
        dropoff_location: "",
        pickup_time: "08:00",
        passenger_name: "",
        passenger_count: 1,
        cost: defaultVehicle ? defaultVehicle.default_cost || 0 : 0,
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDispatch) {
        await updateDispatch(editingDispatch.id, formData);
      } else {
        await createDispatch(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi khi lưu thông tin điều xe: " + err.message);
    }
  };

  const handleDelete = async (id: number, dispatchDate: string, vehicleName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bản ghi điều xe "${vehicleName}" ngày ${dispatchDate}?`))
      return;
    try {
      await deleteDispatch(id);
      loadData();
    } catch (err: any) {
      alert("Lỗi khi xóa bản ghi điều xe: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <DispatchFilterBar
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        ownershipFilter={ownershipFilter}
        setOwnershipFilter={setOwnershipFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onOpenModal={() => handleOpenModal()}
      />

      <DispatchKpiBanner dispatches={dispatches} />

      {loading && <div className="text-center py-8 text-xs text-slate-500">Đang tải nhật ký điều xe...</div>}
      {error && <div className="text-center py-8 text-xs text-red-500 font-medium">{error}</div>}

      {!loading && !error && (
        <DispatchTable
          dispatches={dispatches}
          onEdit={(d) => handleOpenModal(d)}
          onDelete={handleDelete}
        />
      )}

      <DispatchModal
        isOpen={isModalOpen}
        editingDispatch={editingDispatch}
        formData={formData}
        setFormData={setFormData}
        vehicles={vehicles}
        onVehicleSelect={handleVehicleSelect}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
