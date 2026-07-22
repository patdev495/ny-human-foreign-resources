import type {
  Contract,
  ContractCreate,
  ContractUpdate,
  EmployeeHistoryResponse,
  EventDay,
  EventDayCreate,
  ExpiringDocumentsResponse,
  ForeignEmployee,
  ForeignEmployeeCreate,
  ForeignEmployeeUpdate,
  MealAbsence,
  MealAbsenceCreate,
  MealExpenseReportResponse,
  MealPriceConfig,
  MealPriceConfigCreate,
  Room,
  RoomCreate,
  RoomOccupancy,
  RoomUpdate,
  Stay,
  StayCreate,
  StayUpdate,
  TamTru,
  TamTruCreate,
  TamTruUpdate,
  Visa,
  VisaCreate,
  VisaUpdate,
  WorkPermit,
  WorkPermitCreate,
  WorkPermitUpdate,
} from "./types";

const BASE = "/api/hr-foreign";

// --- EMPLOYEES API ---

export async function fetchEmployees(q?: string): Promise<ForeignEmployee[]> {
  const url = q ? `${BASE}/employees?q=${encodeURIComponent(q)}` : `${BASE}/employees`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json() as Promise<ForeignEmployee[]>;
}

export async function fetchEmployee(id: number): Promise<ForeignEmployee> {
  const res = await fetch(`${BASE}/employees/${id}`);
  if (!res.ok) throw new Error("Employee not found");
  return res.json() as Promise<ForeignEmployee>;
}

export async function fetchEmployeeHistory(id: number): Promise<EmployeeHistoryResponse> {
  const res = await fetch(`${BASE}/employees/${id}/history`);
  if (!res.ok) throw new Error("Failed to fetch employee history");
  return res.json() as Promise<EmployeeHistoryResponse>;
}

export async function createEmployee(
  payload: ForeignEmployeeCreate
): Promise<ForeignEmployee> {
  const res = await fetch(`${BASE}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create employee");
  }
  return res.json() as Promise<ForeignEmployee>;
}

export async function updateEmployee(
  id: number,
  payload: ForeignEmployeeUpdate
): Promise<ForeignEmployee> {
  const res = await fetch(`${BASE}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update employee");
  }
  return res.json() as Promise<ForeignEmployee>;
}

export async function deleteEmployee(id: number): Promise<void> {
  const res = await fetch(`${BASE}/employees/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete employee");
}

// --- CONTRACTS API ---

export async function fetchContracts(employeeId: number): Promise<Contract[]> {
  const res = await fetch(`${BASE}/employees/${employeeId}/contracts`);
  if (!res.ok) throw new Error("Failed to fetch contracts");
  return res.json() as Promise<Contract[]>;
}

export async function createContract(
  employeeId: number,
  payload: ContractCreate
): Promise<Contract> {
  const res = await fetch(`${BASE}/employees/${employeeId}/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create contract");
  return res.json() as Promise<Contract>;
}

export async function updateContract(
  contractId: number,
  payload: ContractUpdate
): Promise<Contract> {
  const res = await fetch(`${BASE}/contracts/${contractId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update contract");
  return res.json() as Promise<Contract>;
}

export async function deleteContract(contractId: number): Promise<void> {
  const res = await fetch(`${BASE}/contracts/${contractId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete contract");
}

// --- WORK PERMITS API ---

export async function fetchWorkPermits(employeeId: number): Promise<WorkPermit[]> {
  const res = await fetch(`${BASE}/employees/${employeeId}/work-permits`);
  if (!res.ok) throw new Error("Failed to fetch work permits");
  return res.json() as Promise<WorkPermit[]>;
}

export async function createWorkPermit(
  employeeId: number,
  payload: WorkPermitCreate
): Promise<WorkPermit> {
  const res = await fetch(`${BASE}/employees/${employeeId}/work-permits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create work permit");
  return res.json() as Promise<WorkPermit>;
}

export async function updateWorkPermit(
  permitId: number,
  payload: WorkPermitUpdate
): Promise<WorkPermit> {
  const res = await fetch(`${BASE}/work-permits/${permitId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update work permit");
  return res.json() as Promise<WorkPermit>;
}

export async function deleteWorkPermit(permitId: number): Promise<void> {
  const res = await fetch(`${BASE}/work-permits/${permitId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete work permit");
}

// --- ROOMS & OCCUPANCY API ---

export async function fetchRooms(): Promise<Room[]> {
  const res = await fetch(`${BASE}/rooms`);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json() as Promise<Room[]>;
}

export async function fetchRoomOccupancy(): Promise<RoomOccupancy[]> {
  const res = await fetch(`${BASE}/rooms/occupancy`);
  if (!res.ok) throw new Error("Failed to fetch room occupancy");
  return res.json() as Promise<RoomOccupancy[]>;
}

export async function createRoom(payload: RoomCreate): Promise<Room> {
  const res = await fetch(`${BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create room");
  }
  return res.json() as Promise<Room>;
}

export async function updateRoom(
  id: number,
  payload: RoomUpdate
): Promise<Room> {
  const res = await fetch(`${BASE}/rooms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update room");
  }
  return res.json() as Promise<Room>;
}

export async function deleteRoom(id: number): Promise<void> {
  const res = await fetch(`${BASE}/rooms/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete room");
}

// --- STAYS API ---

export async function fetchStays(employeeId?: number, status?: string): Promise<Stay[]> {
  const params = new URLSearchParams();
  if (employeeId) params.append("employee_id", employeeId.toString());
  if (status) params.append("status", status);
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`${BASE}/stays${query}`);
  if (!res.ok) throw new Error("Failed to fetch stays");
  return res.json() as Promise<Stay[]>;
}

export async function createStay(payload: StayCreate): Promise<Stay> {
  const res = await fetch(`${BASE}/stays`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create stay");
  }
  return res.json() as Promise<Stay>;
}

export async function updateStay(id: number, payload: StayUpdate): Promise<Stay> {
  const res = await fetch(`${BASE}/stays/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update stay");
  }
  return res.json() as Promise<Stay>;
}

// --- VISAS API ---

export async function fetchVisas(stayId: number): Promise<Visa[]> {
  const res = await fetch(`${BASE}/stays/${stayId}/visas`);
  if (!res.ok) throw new Error("Failed to fetch visas");
  return res.json() as Promise<Visa[]>;
}

export async function createVisa(stayId: number, payload: VisaCreate): Promise<Visa> {
  const res = await fetch(`${BASE}/stays/${stayId}/visas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create visa");
  return res.json() as Promise<Visa>;
}

export async function deleteVisa(id: number): Promise<void> {
  const res = await fetch(`${BASE}/visas/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete visa");
}

export async function updateVisa(
  id: number,
  payload: VisaUpdate
): Promise<Visa> {
  const res = await fetch(`${BASE}/visas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update visa");
  return res.json() as Promise<Visa>;
}


// --- TAM TRU API ---

export async function fetchTamTrus(stayId: number): Promise<TamTru[]> {
  const res = await fetch(`${BASE}/stays/${stayId}/tam-trus`);
  if (!res.ok) throw new Error("Failed to fetch tam trus");
  return res.json() as Promise<TamTru[]>;
}

export async function createTamTru(stayId: number, payload: TamTruCreate): Promise<TamTru> {
  const res = await fetch(`${BASE}/stays/${stayId}/tam-trus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create tam tru");
  return res.json() as Promise<TamTru>;
}

export async function deleteTamTru(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tam-trus/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete tam tru");
}

export async function updateTamTru(
  id: number,
  payload: TamTruUpdate
): Promise<TamTru> {
  const res = await fetch(`${BASE}/tam-trus/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update tam tru");
  return res.json() as Promise<TamTru>;
}

// --- EXPIRING DOCUMENTS API ---

export async function fetchExpiringDocuments(days = 30): Promise<ExpiringDocumentsResponse> {
  const res = await fetch(`${BASE}/expiring-documents?days=${days}`);
  if (!res.ok) throw new Error("Failed to fetch expiring documents");
  return res.json() as Promise<ExpiringDocumentsResponse>;
}

// --- MEAL ABSENCES API ---

export async function fetchMealAbsences(stayId: number): Promise<MealAbsence[]> {
  const res = await fetch(`${BASE}/stays/${stayId}/meal-absences`);
  if (!res.ok) throw new Error("Failed to fetch meal absences");
  return res.json() as Promise<MealAbsence[]>;
}

export async function createMealAbsence(
  stayId: number,
  payload: MealAbsenceCreate
): Promise<MealAbsence> {
  const res = await fetch(`${BASE}/stays/${stayId}/meal-absences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create meal absence");
  return res.json() as Promise<MealAbsence>;
}

export async function deleteMealAbsence(id: number): Promise<void> {
  const res = await fetch(`${BASE}/meal-absences/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete meal absence");
}

// --- EVENT DAYS API ---

export async function fetchEventDays(): Promise<EventDay[]> {
  const res = await fetch(`${BASE}/event-days`);
  if (!res.ok) throw new Error("Failed to fetch event days");
  return res.json() as Promise<EventDay[]>;
}

export async function createEventDay(payload: EventDayCreate): Promise<EventDay> {
  const res = await fetch(`${BASE}/event-days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create event day");
  }
  return res.json() as Promise<EventDay>;
}

export async function deleteEventDay(id: number): Promise<void> {
  const res = await fetch(`${BASE}/event-days/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete event day");
}

// --- MEAL PRICE CONFIGS API ---

export async function fetchMealPriceConfigs(): Promise<MealPriceConfig[]> {
  const res = await fetch(`${BASE}/meal-price-configs`);
  if (!res.ok) throw new Error("Failed to fetch meal price configs");
  return res.json() as Promise<MealPriceConfig[]>;
}

export async function createMealPriceConfig(
  payload: MealPriceConfigCreate
): Promise<MealPriceConfig> {
  const res = await fetch(`${BASE}/meal-price-configs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create meal price config");
  return res.json() as Promise<MealPriceConfig>;
}

// --- MEAL EXPENSE REPORT API ---

export async function fetchMealExpenseReport(
  startDate: string,
  endDate: string
): Promise<MealExpenseReportResponse> {
  const res = await fetch(
    `${BASE}/reports/meal-expenses?start_date=${encodeURIComponent(
      startDate
    )}&end_date=${encodeURIComponent(endDate)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch meal expense report");
  }
  return res.json() as Promise<MealExpenseReportResponse>;
}
