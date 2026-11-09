import type { DemandGroup, DemandKey, DemandPerson } from "../../endShiftApi";

export const groupLabels: Record<DemandKey, string> = {
  CN09_1730: "CN09 · 17h30", CN09_2000: "CN09 · 20h00",
  CN15_1730: "CN15 · 17h30", CN15_2000: "CN15 · 20h00",
  SELF_TRAVEL: "Tự di chuyển", NOT_REPORTED: "Chưa báo giờ tan làm",
};
export type GroupFilter = DemandKey | "ALL" | "NEEDS_CAR";
export type GroupedPerson = DemandPerson & { group: DemandKey };

export function needsCar(key: DemandKey): boolean {
  return key !== "SELF_TRAVEL" && key !== "NOT_REPORTED";
}

export function demandTotals(groups: DemandGroup[]) {
  const count = (key: DemandKey): number => groups.find(group => group.key === key)?.count ?? 0;
  return {
    total: groups.reduce((sum, group) => sum + group.count, 0),
    car: groups.filter(group => needsCar(group.key)).reduce((sum, group) => sum + group.count, 0),
    self: count("SELF_TRAVEL"), missing: count("NOT_REPORTED"),
    cn09: count("CN09_1730") + count("CN09_2000"), cn15: count("CN15_1730") + count("CN15_2000"),
    at1730: count("CN09_1730") + count("CN15_1730"), at2000: count("CN09_2000") + count("CN15_2000"),
  };
}

export function demandPeople(groups: DemandGroup[], filter: GroupFilter, search: string): GroupedPerson[] {
  const query = search.trim().toLocaleLowerCase("vi-VN");
  return groups.filter(group => filter === "ALL" || (filter === "NEEDS_CAR" ? needsCar(group.key) : group.key === filter))
    .flatMap(group => group.people.map(person => ({ ...person, group: group.key })))
    .filter(person => `${person.name_latin} ${person.name_chinese || ""} ${person.room_number || ""}`.toLocaleLowerCase("vi-VN").includes(query));
}
