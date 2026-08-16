export type GradeBand = "K-3" | "4-8" | "9-12";

export interface School {
  dbn: string;
  name: string;
  borough: string;
  district: number;
  school_type: string;
  lat: number;
  lng: number;
  building_id: string;
  /**
   * Real per-SCHOOL headcount from the Blue Book (org_enroll) -- distinct from
   * building_utilization.enrollment, which is shared across every school in a
   * co-located building. Null when this org is missing from the Blue Book.
   */
  enrollment: number | null;
}

export interface ClassSizeRecord {
  id: number;
  dbn: string;
  grade_band: GradeBand;
  num_classes: number;
  num_students: number;
  avg_class_size: number;
  target_cap: number;
  /** School year the figure came from, e.g. "2021-22". Null for mock data. */
  source_year: string | null;
  /** "suspect" when the source reported an implausible average (see fetch script). */
  data_quality: "ok" | "suspect";
}

export interface BuildingUtilization {
  building_id: string;
  capacity: number;
  enrollment: number;
  utilization_pct: number;
  co_located: number; // 0/1
  num_schools_in_building: number;
}

export interface RoomInventoryRow {
  id: number;
  building_id: string;
  room_type: string;
  room_count: number;
  /** Null when the source has no per-room seat count (real Blue Book data). */
  typical_capacity: number | null;
  /** Null when the source has no square footage (real Blue Book data). */
  sqft: number | null;
}

/**
 * One (room type, area) group from room_capacity_detail: N rooms in a building
 * that share an identical measured area. Kept per-area rather than averaged --
 * rooms of one type in one building vary widely, and the splitting tool needs
 * to know which INDIVIDUAL rooms are large enough to divide.
 *
 * Lives here rather than in queries.ts so client components can name the shape
 * without importing the database module.
 */
export interface CapacityDetailRow {
  room_type: string;
  sqft: number;
  room_count: number;
}

export interface Parcel {
  parcel_id: string;
  /**
   * COLP's address string. Frequently a bare street name with no house number
   * ("GREENE AVENUE"), and null for ~6% of parcels — use `bbl` to identify the
   * lot when this is missing or vague.
   */
  description: string | null;
  district: number | null;
  lat: number;
  lng: number;
  /** Null for COLP-sourced parcels — the city dataset publishes no lot area. */
  lot_sqft: number | null;
  borough: string | null;
  /**
   * Borough-Block-Lot: NYC's authoritative 10-digit parcel identifier, present
   * on every COLP row. Resolves the exact lot on ZoLa / the Digital Tax Map
   * even when the address string doesn't.
   */
  bbl: string | null;
  ownership: string | null;
}

/**
 * Result of the HS physical-capacity check (lib/queries.ts computeHsPhysicalCapacity):
 * could this school's OWN classrooms hold everyone under cap if spread out?
 * Only computed for single-band 9-12 schools with real enrollment and
 * per-room capacity data -- see that function's doc comment for why.
 */
export interface PhysicalCapacityCheck {
  targetCap: number;
  enrollment: number;
  totalCapacity: number;
  excessStudents: number;
  classroomsNeeded: number;
  feasible: boolean;
  roomsCounted: number;
}

/** A school row augmented with the compliance summary used for search + map coloring. */
export interface SchoolSummary extends School {
  // Worst (avg_class_size - target_cap) across grade bands, floored at 0 --
  // OR, for schools where physicalCapacityCheck applies, classroomsNeeded
  // from that check instead (see listSchoolSummaries). Whichever number is
  // actually driving the map color/sort for this school.
  maxGap: number;
  worstBand: GradeBand | null;
  isDeficitFlagged: boolean;
  /** Non-null only for schools where the physical-capacity check applies and overrides maxGap. */
  physicalCapacityCheck: PhysicalCapacityCheck | null;
}
