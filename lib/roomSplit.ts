/**
 * Room-splitting analysis: which rooms in a building are big enough to divide
 * into two or more smaller classrooms, and how many seats that actually adds.
 *
 * The seat math, and why splitting adds capacity at all:
 *
 * A room's PHYSICAL capacity is its floor area divided by the NYC building
 * code minimum of 20 sqft per pupil (35 for kindergarten and students with
 * physical disabilities). But a room only ever hosts ONE section at a time,
 * and a section is capped by the class size mandate -- so a 1,200 sqft room
 * with a physical capacity of 60 still only seats 25 students in a high
 * school, because the 26th student would put that section over cap. The other
 * 35 seats are unusable, not because the room is full, but because the mandate
 * (correctly) won't let one teacher take them.
 *
 * Divide that room in half and it becomes two rooms of 20+, each hosting its
 * own section -- 40 usable seats where there were 25. The wall converts dead
 * floor area into compliant capacity.
 *
 * Rule used here: pieces are 20 students each (the smallest room worth
 * building, and also the K-3 mandate cap), so a room splits into
 * floor(physicalCapacity / 20) pieces and needs at least 2 of them to be worth
 * doing. A 40-capacity room yields 2 pieces; a 65-capacity room yields 3.
 *
 * Source for the 20 sqft/pupil figure: UFT FAQ "Are there any
 * regulations/rules about how physically large a classroom has to be in size?"
 * (uft.org/faqs) and DOE Blue Book utilization guidelines, both citing the NYC
 * building code minimum.
 *
 * This is a rough feasibility check, not an engineering or code-compliance
 * determination -- a real split also needs egress, HVAC, lighting, and
 * electrical review, plus SCA sign-off. No allowance is subtracted here for
 * the wall itself.
 */
export const MIN_SQFT_PER_PUPIL = 20;
export const MIN_SQFT_PER_PUPIL_KINDERGARTEN = 35;

/** Students per piece after a split. Also the smallest room worth building. */
export const STUDENTS_PER_PIECE = 20;

/**
 * Largest measured area still credible as ONE splittable room.
 *
 * The DOE standard classroom is about 750 sqft; the median measured room in
 * this dataset is 650, and 99% of classrooms come in under 1,250. But the
 * source (wavz-fkw8) also carries records like a 14,801 sqft "Science Lab"
 * and a 5,852 sqft "Classroom" -- a whole floor or wing booked against one
 * room number, not a room anyone could wall in half. Left in, those single
 * rows would claim hundreds of seats each and swamp every real result.
 *
 * 2,000 sqft sits well above any genuine double-size classroom while cutting
 * roughly the top 1% of splittable-type rooms, which is where the artifacts
 * live. Excluded rooms are surfaced in the UI rather than silently dropped.
 */
export const MAX_PLAUSIBLE_ROOM_SQFT = 2000;

/**
 * NYC Building Code Table 1004.5, "assembly without fixed seating --
 * unconcentrated (tables and chairs)": 15 net sqft per occupant. This is a
 * legal occupant-load ceiling, not a count of installed seats.
 */
export const SQFT_PER_CAFETERIA_SEAT = 15;

/**
 * Rooms that lose their purpose if partitioned: auditorium acoustics and
 * sightlines, library collections, gym floor area, cafeteria seating. These
 * are excluded from splitting even when they are physically enormous.
 */
export const UNSPLITTABLE_TYPES = new Set([
  "Auditorium",
  "Library",
  "Gym",
  "Multi-Purpose",
  "Dance/Theatre",
  "Cafeteria",
]);

/**
 * Rooms that can hold a section of students, for the purpose of counting a
 * building's total seated capacity. Excludes the cafeteria (counted
 * separately, at its own sqft/person standard), plus the gym and auditorium,
 * which can absorb an occasional overflow class but can't serve as full-time
 * instructional rooms every period without displacing PE and assemblies
 * entirely.
 */
export const INSTRUCTIONAL_TYPES = new Set([
  "Classroom",
  "Kindergarten",
  "Special Education",
  "Vacant",
  "Science Lab",
  "Computer Lab",
  "Art",
  "Music",
  "Library",
  "Multi-Purpose",
  "Dance/Theatre",
]);

/** One (room type, area) group from room_capacity_detail -- N identical rooms. */
export interface RoomGroup {
  room_type: string;
  sqft: number;
  room_count: number;
}

export interface SplitCandidate extends RoomGroup {
  /** Stable identity for selection state, since (type, sqft) is unique per building. */
  key: string;
  /** Physical capacity of ONE room: floor(sqft / sqftPerPupil). */
  physicalCapacity: number;
  /** Usable seats in ONE room today: min(targetCap, physicalCapacity). */
  seatsNow: number;
  /** How many pieces one room divides into at STUDENTS_PER_PIECE each. */
  pieces: number;
  /** Usable seats in ONE room after splitting: pieces * STUDENTS_PER_PIECE. */
  seatsAfter: number;
  /** Seats gained by splitting ONE room. Always > 0 for a candidate. */
  seatsGainedPerRoom: number;
}

/** Physical capacity of a single room, before the mandate cap is applied. */
export function physicalCapacityOf(roomType: string, sqft: number): number {
  const perPupil = roomType === "Kindergarten" ? MIN_SQFT_PER_PUPIL_KINDERGARTEN : MIN_SQFT_PER_PUPIL;
  return Math.floor(sqft / perPupil);
}

/**
 * Every room group in a building worth splitting, best-gain first.
 *
 * A group qualifies when its type survives partition, one room divides into
 * at least 2 pieces, and splitting actually nets seats -- the last condition
 * matters for kindergarten rooms, where the 35 sqft/pupil standard can make a
 * room look large by area while yielding no additional compliant sections.
 */
export function findSplitCandidates(groups: RoomGroup[], targetCap: number): SplitCandidate[] {
  const candidates: SplitCandidate[] = [];

  for (const g of groups) {
    if (UNSPLITTABLE_TYPES.has(g.room_type)) continue;
    if (!Number.isFinite(g.sqft) || g.sqft <= 0 || g.room_count <= 0) continue;
    if (g.sqft > MAX_PLAUSIBLE_ROOM_SQFT) continue;

    const physicalCapacity = physicalCapacityOf(g.room_type, g.sqft);
    const pieces = Math.floor(physicalCapacity / STUDENTS_PER_PIECE);
    if (pieces < 2) continue;

    const seatsNow = Math.min(targetCap, physicalCapacity);
    const seatsAfter = pieces * STUDENTS_PER_PIECE;
    const seatsGainedPerRoom = seatsAfter - seatsNow;
    if (seatsGainedPerRoom <= 0) continue;

    candidates.push({
      ...g,
      key: `${g.room_type}|${g.sqft}`,
      physicalCapacity,
      seatsNow,
      pieces,
      seatsAfter,
      seatsGainedPerRoom,
    });
  }

  return candidates.sort(
    (a, b) =>
      b.seatsGainedPerRoom * b.room_count - a.seatsGainedPerRoom * a.room_count ||
      b.seatsGainedPerRoom - a.seatsGainedPerRoom
  );
}

export interface SplitPlanResult {
  /** Rooms selected for splitting, across all groups. */
  roomsSplit: number;
  /** Total seats added by the selection. */
  seatsGained: number;
  /** Seats gained expressed in whole classrooms-worth at the mandate cap. */
  classroomEquivalents: number;
  /** Net change in room count: each split room becomes `pieces` rooms. */
  roomsAdded: number;
}

/**
 * Total effect of a selection, where `selection` maps a candidate key to how
 * many of that group's rooms to split.
 */
export function summarizeSplitPlan(
  candidates: SplitCandidate[],
  selection: Record<string, number>,
  targetCap: number
): SplitPlanResult {
  let roomsSplit = 0;
  let seatsGained = 0;
  let roomsAdded = 0;

  for (const c of candidates) {
    const n = Math.max(0, Math.min(c.room_count, Math.floor(selection[c.key] ?? 0)));
    if (n === 0) continue;
    roomsSplit += n;
    seatsGained += n * c.seatsGainedPerRoom;
    roomsAdded += n * (c.pieces - 1);
  }

  return {
    roomsSplit,
    seatsGained,
    classroomEquivalents: targetCap > 0 ? seatsGained / targetCap : 0,
    roomsAdded,
  };
}

/**
 * Total seated capacity of a building's instructional rooms, with a split
 * plan applied. This is the R-equivalent seat count feeding the extended-day
 * check -- real per-room seats rather than roomCount * cap, because rooms in
 * one building vary widely in size (see computeHsPhysicalCapacity).
 */
export function totalInstructionalSeats(
  groups: RoomGroup[],
  targetCap: number,
  selection: Record<string, number> = {}
): { seats: number; rooms: number } {
  let seats = 0;
  let rooms = 0;

  for (const g of groups) {
    if (!INSTRUCTIONAL_TYPES.has(g.room_type)) continue;

    const key = `${g.room_type}|${g.sqft}`;
    const physicalCapacity = physicalCapacityOf(g.room_type, g.sqft);
    const pieces = Math.floor(physicalCapacity / STUDENTS_PER_PIECE);
    const splittable =
      !UNSPLITTABLE_TYPES.has(g.room_type) && pieces >= 2 && g.sqft <= MAX_PLAUSIBLE_ROOM_SQFT;
    const selected = splittable
      ? Math.max(0, Math.min(g.room_count, Math.floor(selection[key] ?? 0)))
      : 0;

    const unsplit = g.room_count - selected;
    seats += unsplit * Math.min(targetCap, physicalCapacity);
    rooms += unsplit;

    seats += selected * pieces * STUDENTS_PER_PIECE;
    rooms += selected * pieces;
  }

  return { seats, rooms };
}

/**
 * Rooms of a splittable type that were set aside as too large to be one room
 * (see MAX_PLAUSIBLE_ROOM_SQFT), so the UI can say so instead of silently
 * dropping them.
 */
export function findImplausibleRooms(groups: RoomGroup[]): RoomGroup[] {
  return groups
    .filter(
      (g) =>
        !UNSPLITTABLE_TYPES.has(g.room_type) &&
        Number.isFinite(g.sqft) &&
        g.sqft > MAX_PLAUSIBLE_ROOM_SQFT &&
        g.room_count > 0
    )
    .sort((a, b) => b.sqft - a.sqft);
}

/** Cafeteria occupant load from measured area, at 15 net sqft per person. */
export function cafeteriaCapacityFromSqft(sqft: number | null | undefined): number {
  if (!sqft || !Number.isFinite(sqft) || sqft <= 0) return 0;
  return Math.floor(sqft / SQFT_PER_CAFETERIA_SEAT);
}
