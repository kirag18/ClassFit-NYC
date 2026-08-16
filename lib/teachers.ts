/**
 * Teacher-need calculator: how many more sections does compliance require,
 * and how many teachers does it take to cover them?
 *
 * Sections come first. A grade band needs ceil(students / cap) sections to
 * put every student in a compliant class; anything above what it runs today
 * is a section that has to be created.
 *
 * Teachers follow from sections, but NOT one-to-one -- a teacher covers
 * several sections a day, so dividing matters. Under the UFT contract a high
 * school teacher's programmed day is 5 teaching periods plus a professional
 * period and a prep; elementary and middle school assignments differ. That
 * makes 5 a reasonable default and a bad constant, so it stays an input.
 *
 * Scale check: NYCPS's own estimate for full compliance citywide is roughly
 * 10,000-12,000 additional teachers (see CITYWIDE_TEACHER_ESTIMATE). A
 * per-school figure here should look like a small fraction of that.
 */

/** Default teaching sections per teacher per day (UFT HS programmed day). */
export const DEFAULT_SECTIONS_PER_TEACHER = 5;

/**
 * Rough average NYC public school teacher base salary, used only to attach an
 * order-of-magnitude dollar figure to a headcount. Deliberately a single flat
 * constant: real cost depends on each hire's step and differentials, and
 * pension, health, and payroll taxes add roughly another 35-45% on top of
 * base that this number does not include.
 */
export const AVG_TEACHER_SALARY = 100_000;

/** NYCPS's own citywide estimate of additional teachers needed for full compliance. */
export const CITYWIDE_TEACHER_ESTIMATE = { low: 10_000, high: 12_000 };

import { sectionsNeededForCap, additionalSectionsNeeded } from "./compliance";

export interface TeacherNeedInput {
  /**
   * Students in the band. For 9-12 this is course SEATS rather than headcount
   * (one student in 5 core courses counts 5 times) -- which is what this
   * calculation wants, since seats divided by cap is exactly the number of
   * sections needed.
   */
  numStudents: number;
  /** Sections the band runs today. */
  currentSections: number;
  /** Mandate cap for the band: 20 (K-3), 23 (4-8), 25 (9-12). */
  targetCap: number;
  /** Teaching sections one teacher covers per day. */
  sectionsPerTeacher: number;
}

export interface TeacherNeedResult {
  /** ceil(students / cap): sections required for every student to be under cap. */
  sectionsNeeded: number;
  /** Sections that have to be created beyond what runs today. */
  additionalSections: number;
  /** ceil(additionalSections / sectionsPerTeacher). */
  additionalTeachers: number;
  /** additionalTeachers * AVG_TEACHER_SALARY, base salary only. */
  estimatedAnnualCost: number;
  /** Average class size implied by the current student/section split. */
  currentAvgClassSize: number;
  /** True when the band already runs enough sections. */
  alreadyCompliant: boolean;
}

export function calculateTeacherNeed({
  numStudents,
  currentSections,
  targetCap,
  sectionsPerTeacher,
}: TeacherNeedInput): TeacherNeedResult {
  const students = Math.max(0, numStudents);
  const current = Math.max(0, Math.floor(currentSections));
  const cap = Math.max(1, targetCap);
  const perTeacher = Math.max(1, Math.floor(sectionsPerTeacher) || 1);

  const sectionsNeeded = sectionsNeededForCap(students, cap);
  const additionalSections = additionalSectionsNeeded(students, current, cap);
  const additionalTeachers = Math.ceil(additionalSections / perTeacher);

  return {
    sectionsNeeded,
    additionalSections,
    additionalTeachers,
    estimatedAnnualCost: additionalTeachers * AVG_TEACHER_SALARY,
    currentAvgClassSize: current > 0 ? students / current : 0,
    alreadyCompliant: additionalSections === 0,
  };
}
