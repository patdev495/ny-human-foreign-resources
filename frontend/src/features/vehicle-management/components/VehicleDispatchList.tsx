import React, { useEffect, useState } from "react";
import {
  createDispatch,
  deleteDispatch,
  fetchDispatches,
  fetchProviders,
  fetchVehicles,
  updateDispatch,
} from "../api";
import type {
  OwnershipGroup,
  Vehicle,
  VehicleDispatch,
  VehicleDispatchCreatePayload,
  VehicleProvider,
} from "../types";
import { DispatchFilterBar } from "./dispatch/DispatchFilterBar";
import { DispatchKpiBanner } from "./dispatch/DispatchKpiBanner";
import { DispatchModal } from "./dispatch/DispatchModal";
import { DispatchTable } from "./dispatch/DispatchTable";
import { QuickOdometerModal } from "./dispatch/QuickOdometerModal";

export const VehicleDispatchList: React.FC = () => {
  const [dispatches, setDispatches] = useState<VehicleDispatch[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [providers, setProviders] = useState<VehicleProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick Odometer Modal State
  const [quickOdoDispatch, setQuickOdoDispatch] = useState<VehicleDispatch | null>(null);
  const [isQuickOdoOpen, setIsQuickOdoOpen] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDispatch, setEditingDispatch] = useState<VehicleDispatch | null>(null);
  const [formData, setFormData] = useState<VehicleDispatchCreatePayload>({
    dispatch_date: new Date().toISOString().split("T")[0],
    provider_id: undefined,
    provider_name: "",
    vehicle_id: undefined,
    vehicle_name: "",
    ownership_group: "COMPANY_OWNED",
    driver_name: "",
    license_plate: "",
    driver_phone: "",
    pickup_location: "",
    dropoff_location: "",
    pickup_time: "08:00",
    passenger_name: "",
    passenger_count: 1,
    route_type: "FIXED_ROUTE",
    distance_km: 0,
    waiting_hours: 0,
    calculated_cost: 0,
    cost: 0,
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let ownershipGroupFilter: OwnershipGroup | undefined = undefined;
      let providerIdFilter: number | undefined = undefined;

      if (selectedProviderFilter === "COMPANY_OWNED") {
        ownershipGroupFilter = "COMPANY_OWNED";
      } else if (selectedProviderFilter === "OUTSOURCED") {
        ownershipGroupFilter = "OUTSOURCED";
      } else if (selectedProviderFilter.startsWith("PROVIDER_")) {
        providerIdFilter = parseInt(selectedProviderFilter.replace("PROVIDER_", ""), 10);
      }

      const [dispatchData, vehicleData, providerData] = await Promise.all([
        fetchDispatches({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          ownershipGroup: ownershipGroupFilter,
          providerId: providerIdFilter,
          search: searchQuery || undefined,
        }),
        fetchVehicles(),
        fetchProviders(),
      ]);
      setDispatches(dispatchData);
      setVehicles(vehicleData);
      setProviders(providerData);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải nhật ký điều xe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fromDate, toDate, selectedProviderFilter]);

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
        provider_id: selected.provider_id || prev.provider_id,
        driver_name: selected.driver_name || prev.driver_name,
        license_plate: selected.license_plate || prev.license_plate,
        driver_phone: selected.driver_phone || prev.driver_phone,
        cost: selected.default_cost || prev.cost,
      }));
    }
  };

  const handleOpenModal = (dispatch?: VehicleDispatch) => {
    if (dispatch) {
      setEditingDispatch(dispatch);
      setFormData({
        dispatch_date: dispatch.dispatch_date,
        provider_id: dispatch.provider_id || undefined,
        provider_name: dispatch.provider_name || "",
        vehicle_id: dispatch.vehicle_id || undefined,
        vehicle_name: dispatch.vehicle_name,
        ownership_group: dispatch.ownership_group,
        driver_name: dispatch.driver_name || "",
        license_plate: dispatch.license_plate || "",
        driver_phone: dispatch.driver_phone || "",
        pickup_location: dispatch.pickup_location || "",
        dropoff_location: dispatch.dropoff_location || "",
        pickup_time: dispatch.pickup_time || "",
        passenger_name: dispatch.passenger_name || "",
        passenger_count: dispatch.passenger_count || 1,
        start_km: dispatch.start_km ?? undefined,
        end_km: dispatch.end_km ?? undefined,
        vendor_route_id: dispatch.vendor_route_id || undefined,
        route_type: dispatch.route_type || "FIXED_ROUTE",
        distance_km: dispatch.distance_km || 0,
        waiting_hours: dispatch.waiting_hours || 0,
        calculated_cost: dispatch.calculated_cost || 0,
        cost: dispatch.cost || 0,
        notes: dispatch.notes || "",
      });
    } else {
      setEditingDispatch(null);
      const defaultProvider = providers.find((p) => p.name === "Bình An") || providers[0];
      const isCompany = defaultProvider?.provider_type === "COMPANY_OWNED";
      const defaultVehicle = isCompany
        ? vehicles.find((v) => (defaultProvider ? v.provider_id === defaultProvider.id : true) || v.ownership_group === "COMPANY_OWNED")
        : undefined;

      setFormData({
        dispatch_date: new Date().toISOString().split("T")[0],
        provider_id: defaultProvider ? defaultProvider.id : undefined,
        provider_name: defaultProvider ? defaultProvider.name : "",
        vehicle_id: defaultVehicle ? defaultVehicle.id : undefined,
        vehicle_name: defaultVehicle ? defaultVehicle.name : "",
        ownership_group: defaultProvider ? defaultProvider.provider_type : "OUTSOURCED",
        driver_name: defaultVehicle ? defaultVehicle.driver_name || "" : "",
        license_plate: defaultVehicle ? defaultVehicle.license_plate || "" : "",
        driver_phone: defaultVehicle ? defaultVehicle.driver_phone || "" : "",
        pickup_location: "",
        dropoff_location: "",
        pickup_time: "08:00",
        passenger_name: "",
        passenger_count: 1,
        start_km: undefined,
        end_km: undefined,
        route_type: "FIXED_ROUTE",
        distance_km: 0,
        waiting_hours: 0,
        calculated_cost: 0,
        cost: 0,
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
        providers={providers}
        selectedProviderFilter={selectedProviderFilter}
        setSelectedProviderFilter={setSelectedProviderFilter}
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
          onQuickOdo={(d) => {
            setQuickOdoDispatch(d);
            setIsQuickOdoOpen(true);
          }}
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

      <QuickOdometerModal
        isOpen={isQuickOdoOpen}
        dispatch={quickOdoDispatch}
        onClose={() => setIsQuickOdoOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
