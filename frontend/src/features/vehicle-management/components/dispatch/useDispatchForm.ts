import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { calculateCost, fetchVendorRoutes } from "../../api";
import type { RouteType, Vehicle, VehicleDispatchCreatePayload, VehicleProvider, VendorRoute } from "../../types";

export function useDispatchForm(isOpen: boolean, formData: VehicleDispatchCreatePayload,
  setFormData: Dispatch<SetStateAction<VehicleDispatchCreatePayload>>, providers: VehicleProvider[], vehicles: Vehicle[]) {
  const [vendorRoutes, setVendorRoutes] = useState<VendorRoute[]>([]);
  const seatType = vendorRoutes.find(route => route.id === formData.vendor_route_id)?.seat_type || "4 chỗ";
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [retry, setRetry] = useState(0);
  const calculation = useRef(0);

  useEffect(() => {
    calculation.current += 1;
    setCalculating(false);
    setPricingError(null);
    if (isOpen) return () => { calculation.current += 1; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !formData.provider_id || formData.ownership_group === "COMPANY_OWNED") {
      setVendorRoutes([]);
      setRoutesError(null);
      setRoutesLoading(false);
      return;
    }
    let active = true;
    setVendorRoutes([]);
    setRoutesError(null);
    setRoutesLoading(true);
    fetchVendorRoutes(formData.provider_id).then(routes => {
      if (!active) return;
      setVendorRoutes(routes);
    }).catch((failure: unknown) => {
      if (active) setRoutesError(failure instanceof Error ? failure.message : "Không tải được bảng giá tuyến đường.");
    }).finally(() => { if (active) setRoutesLoading(false); });
    return () => { active = false; };
  }, [isOpen, formData.provider_id, formData.ownership_group, retry]);

  async function handleCalculateCost(pId?: number | null, routeId?: number | null, routeType?: RouteType,
    km?: number, waiting?: number, seats?: string) {
    const current = ++calculation.current;
    setPricingError(null);
    const providerId = pId !== undefined ? pId : formData.provider_id;
    const provider = providers.find(item => item.id === providerId);
    if (provider?.provider_type === "COMPANY_OWNED") { setCalculating(false); return; }
    setCalculating(true);
    try {
      const result = await calculateCost({ provider_id: providerId,
        vendor_route_id: routeId !== undefined ? routeId : formData.vendor_route_id,
        route_type: routeType ?? formData.route_type ?? "FIXED_ROUTE", seat_type: seats || seatType,
        distance_km: km ?? formData.distance_km ?? 0, waiting_hours: waiting ?? formData.waiting_hours ?? 0 });
      if (current !== calculation.current) return;
      setFormData(previous => ({ ...previous, calculated_cost: result.total_calculated_cost,
        cost: result.total_calculated_cost > 0 ? result.total_calculated_cost : previous.cost }));
    } catch (failure: unknown) {
      if (current === calculation.current) setPricingError(failure instanceof Error ? failure.message : "Không tính được giá gợi ý. Hãy thử lại hoặc nhập cước thực tế.");
    } finally { if (current === calculation.current) setCalculating(false); }
  }

  function handleProviderChange(value: string) {
    const providerId = value ? Number(value) : undefined;
    const provider = providers.find(item => item.id === providerId);
    const ownership = provider?.provider_type || "COMPANY_OWNED";
    const vehicle = ownership === "COMPANY_OWNED"
      ? vehicles.find(item => (providerId ? item.provider_id === providerId : true) || item.ownership_group === "COMPANY_OWNED") : undefined;
    setFormData(previous => ({ ...previous, provider_id: providerId, provider_name: provider?.name || "",
      ownership_group: ownership, vendor_route_id: undefined, vehicle_id: vehicle?.id, vehicle_name: vehicle?.name || "",
      driver_name: vehicle?.driver_name || "", license_plate: vehicle?.license_plate || "", driver_phone: vehicle?.driver_phone || "" }));
    if (providerId) void handleCalculateCost(providerId, null);
    else {
      calculation.current += 1;
      setCalculating(false);
      setPricingError(null);
    }
  }

  function handleRouteSelect(value: string) {
    calculation.current += 1;
    setCalculating(false);
    if (!value) { setFormData(previous => ({ ...previous, vendor_route_id: undefined })); return; }
    const route = vendorRoutes.find(item => item.id === Number(value));
    if (!route) return;
    setFormData(previous => ({ ...previous, vendor_route_id: route.id, pickup_location: route.pickup_location,
      dropoff_location: route.dropoff_location, route_type: "FIXED_ROUTE",
      vehicle_name: previous.vehicle_name && previous.ownership_group === "COMPANY_OWNED" ? previous.vehicle_name : `Xe ${route.seat_type} (${previous.provider_name || "Thuê ngoài"})` }));
    void handleCalculateCost(formData.provider_id, route.id, "FIXED_ROUTE", formData.distance_km, formData.waiting_hours, route.seat_type);
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const provider = providers.find(item => item.id === formData.provider_id);
    if (provider && vehicle.provider_id) return vehicle.provider_id === provider.id;
    return vehicle.ownership_group === (provider?.provider_type || formData.ownership_group);
  });
  return { vendorRoutes, filteredVehicles, handleProviderChange, handleRouteSelect, handleCalculateCost,
    pricingError, routesError, routesLoading, calculating, retryRoutes: () => setRetry(value => value + 1) };
}
