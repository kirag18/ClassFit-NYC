/** Shared compliance-gap tiering used by the map, search list, and detail page. */
export type ComplianceTier = "compliant" | "near" | "overcrowded" | "severe";

export interface ComplianceStatus {
  tier: ComplianceTier;
  label: string;
  color: string; // hex, used for map markers + badges
}

export function getComplianceStatus(gap: number): ComplianceStatus {
  if (gap <= 0) return { tier: "compliant", label: "Within cap", color: "#16a34a" }; // green-600
  if (gap <= 2) return { tier: "near", label: "Slightly over", color: "#ca8a04" }; // yellow-600
  if (gap <= 5) return { tier: "overcrowded", label: "Overcrowded", color: "#ea580c" }; // orange-600
  return { tier: "severe", label: "Severely overcrowded", color: "#dc2626" }; // red-600
}

/**
 * High school class size is reported per CORE COURSE SECTION, not per homeroom:
 * a student taking 5 core courses contributes 5 "students" across 5 sections.
 * So for 9-12 the counts are course seats / sections, not headcount / rooms.
 * The average class size stays valid (seats ÷ sections); only the raw totals
 * need relabelling.
 */
export function isCourseSectionBand(gradeBand: string): boolean {
  return gradeBand === "9-12";
}

export function formatGap(gap: number): string {
  if (gap <= 0) return "At or under cap";
  return `${gap.toFixed(1)} over cap`;
}

/**
 * Sections required to put every student in a class at or under the cap.
 *
 * For 9-12, `numStudents` is course SEATS rather than headcount (see
 * isCourseSectionBand) -- which is what this wants: seats divided by cap is
 * exactly the number of course sections that have to run.
 */
export function sectionsNeededForCap(numStudents: number, targetCap: number): number {
  return Math.ceil(Math.max(0, numStudents) / Math.max(1, targetCap));
}

/** Sections that have to be created beyond the ones running today. */
export function additionalSectionsNeeded(
  numStudents: number,
  currentSections: number,
  targetCap: number
): number {
  return Math.max(0, sectionsNeededForCap(numStudents, targetCap) - Math.max(0, currentSections));
}

/**
 * Label for schools where the HS physical-capacity check overrides maxGap
 * (see lib/queries.ts computeHsPhysicalCapacity). Deliberately different
 * wording from formatGap: the number here is classrooms needed / found, not
 * an average-class-size differential, and "X.0 over cap" would misdescribe
 * a room shortfall as a class-size one.
 */
export function formatPhysicalCapacityGap(check: { feasible: boolean; classroomsNeeded: number }): string {
  if (check.feasible) return "Fits in existing rooms";
  return `${check.classroomsNeeded} more room${check.classroomsNeeded === 1 ? "" : "s"} needed`;
}

/**
 * Plain-language one-liner for a single grade band, e.g.:
 * "27 students, target is 25 — needs to cut ~2 students per class on average."
 */
export function plainLanguageStatus(avgClassSize: number, targetCap: number): string {
  const gap = avgClassSize - targetCap;
  const rounded = Math.round(avgClassSize);
  const capRounded = Math.round(targetCap);
  if (gap <= 0) {
    return `${rounded} students, target is ${capRounded} — already within the mandated cap.`;
  }
  const cut = Math.ceil(gap);
  return `${rounded} students, target is ${capRounded} — needs to cut ~${cut} student${
    cut === 1 ? "" : "s"
  } per class on average.`;
}
