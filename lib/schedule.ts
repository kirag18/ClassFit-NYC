/**
 * Extended-day / staggered-cohort capacity check.
 *
 * The idea: if the building runs more periods in a day (P) than any one
 * student's schedule occupies (L), students don't all have to be in the
 * building at the same time. Cohorts start at staggered times -- cohort 1
 * runs periods 1..L, cohort 2 runs 2..L+1, and so on -- which spreads the
 * same enrollment across a longer day using the same rooms.
 *
 * How many cohorts that allows:
 *
 *     k = P - L + 1
 *
 * The catch is the middle of the day, when every cohort is on site at once.
 * The earliest cohort occupies periods 1..L and the latest occupies
 * (P-L+1)..P, so they overlap on periods (P-L+1)..L -- a window of
 *
 *     overlap = L - (P - L + 1) + 1 = 2L - P
 *
 * periods. If that is <= 0 the schedule never has all cohorts present
 * simultaneously and peak load is not the whole enrollment, so the building
 * fits by construction. If it is positive, then during those periods every
 * enrolled student must physically be somewhere in the building -- in a
 * classroom seat or at a cafeteria table -- and that is the number to check
 * against.
 *
 * How much the cafeteria actually absorbs:
 *
 * A student eats lunch ONCE, so the cafeteria never holds more than one
 * period's worth of students at a time. Spread lunch across the `overlap`
 * conflict periods and demand is N / overlap per period -- with 8 conflict
 * periods only an eighth of the school is at lunch at any moment. The room
 * also has its own ceiling, so what it takes off the classrooms is
 *
 *     min(Caf, N / overlap)
 *
 * not Caf. Crediting the full cafeteria would double-count it as permanent
 * overflow space that every student occupies all day, which badly overstates
 * capacity whenever lunch is thinly spread. When Caf is the smaller term the
 * cafeteria is saturated -- full every conflict period and still not able to
 * feed everyone in the window.
 *
 * This is a peak-load feasibility check, not a bell-schedule generator. It
 * says whether the building can hold everyone at the busiest moment; it does
 * not assign sections to rooms or periods, and it ignores staff contracts,
 * transportation, and whether families will accept a 7am or 5pm start.
 */
export interface ExtendedDayInput {
  /** P: total periods the building offers across the whole day. */
  periodsInDay: number;
  /** L: periods in one student's schedule. */
  periodsPerStudent: number;
  /** N: total students enrolled. */
  totalStudents: number;
  /** Seated capacity of all instructional rooms (see totalInstructionalSeats). */
  classroomSeats: number;
  /** Caf: cafeteria occupant load, from measured area at 15 sqft/person. */
  cafeteriaCapacity: number;
}

export interface ExtendedDayResult {
  /** k = P - L + 1: how many staggered cohorts the day allows. */
  cohorts: number;
  /** 2L - P: periods where every cohort is on site at once. <= 0 means none. */
  overlapPeriods: number;
  /** True when overlap <= 0 -- peak load is never the full enrollment. */
  noFullOverlap: boolean;
  /** N / overlap: students needing lunch in any one conflict period. */
  lunchDemandPerPeriod: number;
  /** min(Caf, lunchDemandPerPeriod): what the cafeteria actually takes off the classrooms. */
  studentsAtLunch: number;
  /** True when the cafeteria is the binding term -- full every conflict period. */
  cafeteriaSaturated: boolean;
  /** classroomSeats + studentsAtLunch: everyone the building holds at once. */
  available: number;
  /** Students with nowhere to sit during the overlap window. 0 if it fits. */
  shortfall: number;
  /** Spare seats during the overlap window. 0 if it doesn't fit. */
  slack: number;
  fits: boolean;
  /** True when the inputs describe an impossible day (L > P). */
  invalid: boolean;
}

export function calculateExtendedDay({
  periodsInDay,
  periodsPerStudent,
  totalStudents,
  classroomSeats,
  cafeteriaCapacity,
}: ExtendedDayInput): ExtendedDayResult {
  const P = Math.max(1, Math.floor(periodsInDay) || 1);
  const L = Math.max(1, Math.floor(periodsPerStudent) || 1);
  const N = Math.max(0, Math.floor(totalStudents) || 0);
  const seats = Math.max(0, classroomSeats);
  const caf = Math.max(0, cafeteriaCapacity);

  // A student can't be scheduled for more periods than the day contains.
  if (L > P) {
    return {
      cohorts: 0,
      overlapPeriods: L,
      noFullOverlap: false,
      lunchDemandPerPeriod: 0,
      studentsAtLunch: 0,
      cafeteriaSaturated: false,
      available: seats,
      shortfall: 0,
      slack: 0,
      fits: false,
      invalid: true,
    };
  }

  const cohorts = P - L + 1;
  const overlapPeriods = 2 * L - P;
  const noFullOverlap = overlapPeriods <= 0;

  // A student eats once, so lunch spreads across the conflict periods and the
  // cafeteria only ever holds one period's share -- capped by the room itself.
  const lunchDemandPerPeriod = noFullOverlap ? 0 : Math.ceil(N / overlapPeriods);
  const studentsAtLunch = noFullOverlap ? 0 : Math.min(caf, lunchDemandPerPeriod);
  const available = seats + studentsAtLunch;

  // With no full-overlap window the whole enrollment is never on site at
  // once, so the peak-load check doesn't bind.
  const fits = noFullOverlap || N <= available;

  return {
    cohorts,
    overlapPeriods,
    noFullOverlap,
    lunchDemandPerPeriod,
    studentsAtLunch,
    cafeteriaSaturated: !noFullOverlap && caf < lunchDemandPerPeriod,
    available,
    shortfall: fits ? 0 : N - available,
    slack: fits && !noFullOverlap ? available - N : 0,
    fits,
    invalid: false,
  };
}
