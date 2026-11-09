import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDispatches } from "../../api";
import type { OwnershipGroup, VehicleDispatch } from "../../types";
import { dispatchToday } from "../dispatch/dispatchForm";

export function useStatsDispatches(ownershipGroup: OwnershipGroup) {
  const [fromDate, setFromDate] = useState(() => `${dispatchToday().slice(0, 7)}-01`);
  const [toDate, setToDate] = useState(dispatchToday);
  const [dispatches, setDispatches] = useState<VehicleDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError(null);
    if (fromDate && toDate && fromDate > toDate) {
      setError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
      setLoading(false);
      return;
    }
    try {
      const result = await fetchDispatches({ fromDate: fromDate || undefined, toDate: toDate || undefined, ownershipGroup });
      if (current === request.current) setDispatches(result);
    } catch (failure: unknown) {
      if (current === request.current) setError(failure instanceof Error ? failure.message : "Không tải được bảng kê chuyến xe.");
    } finally { if (current === request.current) setLoading(false); }
  }, [fromDate, toDate, ownershipGroup]);
  useEffect(() => {
    void load();
    return () => { request.current += 1; };
  }, [load]);
  return { fromDate, setFromDate, toDate, setToDate, dispatches, loading, error, load };
}
