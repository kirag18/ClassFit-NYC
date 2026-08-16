import type { ClassSizeRecord, RoomInventoryRow } from "./types";
import { additionalSectionsNeeded } from "./compliance";

/**
 * Feature 4: fast-track solver.
 *
 * This is deliberately a GREEDY HEURISTIC, not an optimizer: it walks room
 * types in a fixed "least disruptive first" order and greedily assigns them
 * against the shortfall until the shortfall is covered or room types run out.
 * It will not find the minimum-disruption combination in every case -- it
 * finds a reasonable, explainable one fast, which is the point for a
 * fast-track suggestion tool.
 */
export interface FastTrackSuggestion {
  id: string;
  title: string;
  description: string;
  roomType: string;
  roomsUsed: number;
  classesResolved: number;
  estimatedAdditionalTeachers: number;
  feasibilityRank: number; // 1 = easiest / fewest changes
  tradeoff: string;
}

// Lower number = converted first (least disruptive / fewest downstream changes).
const ROOM_PRIORITY: { type: string; rank: number; verb: (count: number) => string; tradeoff: string }[] = [
  {
    // The real Blue Book reports specialty rooms only as one aggregate
    // "cluster room" count, without naming which are art/music/science.
    type: "Cluster/Specialty",
    rank: 1,
    verb: (n) =>
      `Convert ${n} cluster/specialty room period${n === 1 ? "" : "s"} to homeroom instruction`,
    tradeoff:
      "The Blue Book doesn't say which specialty subjects these rooms serve — confirm locally which programs would be displaced.",
  },
  {
    type: "Library",
    rank: 1,
    verb: (n) => `Convert ${n} period${n === 1 ? "" : "s"} of library use to homeroom instruction`,
    tradeoff: "Reduces library access time for other classes during converted periods.",
  },
  {
    type: "Art",
    rank: 1,
    verb: (n) => `Convert ${n} period${n === 1 ? "" : "s"} of art room use to homeroom instruction`,
    tradeoff: "Art classes must be rescheduled or held in a shared/rotating space.",
  },
  {
    type: "Music",
    rank: 1,
    verb: (n) => `Convert ${n} period${n === 1 ? "" : "s"} of music room use to homeroom instruction`,
    tradeoff: "Music classes must be rescheduled or held in a shared/rotating space.",
  },
  {
    type: "Cafeteria",
    rank: 2,
    verb: (n) =>
      `Stagger lunch periods to free the cafeteria as an overflow classroom for ${n} section${n === 1 ? "" : "s"}`,
    tradeoff: "Requires renegotiating the lunch schedule and adds supervision complexity.",
  },
  {
    type: "Science Lab",
    rank: 3,
    verb: (n) => `Repurpose ${n} science lab period${n === 1 ? "" : "s"} for homeroom use`,
    tradeoff: "Lab-based instruction must relocate; equipment/safety setup limits flexibility.",
  },
  {
    type: "Gym",
    rank: 3,
    verb: (n) => `Repurpose ${n} gym period${n === 1 ? "" : "s"} for homeroom use`,
    tradeoff: "PE classes need an alternate space or outdoor scheduling; least preferred option.",
  },
];

/**
 * Given a school's class size records and its building's non-homeroom room
 * inventory, greedily suggest up to 3 room-reallocation strategies to close
 * the classroom shortfall, ranked easiest-first.
 */
export function generateFastTrackSuggestions(
  bands: ClassSizeRecord[],
  rooms: RoomInventoryRow[]
): FastTrackSuggestion[] {
  // Total additional sections needed across all grade bands to hit their caps;
  // each one needs a room to run in.
  let shortfall = 0;
  for (const b of bands) {
    shortfall += additionalSectionsNeeded(b.num_students, b.num_classes, b.target_cap);
  }
  if (shortfall <= 0) return [];

  const nonHomeroomRooms = rooms.filter((r) => r.room_type !== "Homeroom");
  const availableByType = new Map(nonHomeroomRooms.map((r) => [r.room_type, r.room_count]));

  const orderedCandidates = ROOM_PRIORITY.filter((p) => (availableByType.get(p.type) ?? 0) > 0).sort(
    (a, b) => a.rank - b.rank
  );

  const suggestions: FastTrackSuggestion[] = [];
  let remaining = shortfall;

  for (const candidate of orderedCandidates) {
    if (remaining <= 0 || suggestions.length >= 3) break;
    const available = availableByType.get(candidate.type) ?? 0;
    const roomsUsed = Math.min(available, remaining);
    if (roomsUsed <= 0) continue;

    suggestions.push({
      id: candidate.type.toLowerCase().replace(/\s+/g, "-"),
      title: candidate.verb(roomsUsed),
      description: `Uses ${roomsUsed} of the building's ${available} ${candidate.type.toLowerCase()} room${
        available === 1 ? "" : "s"
      } as additional homeroom-capable space.`,
      roomType: candidate.type,
      roomsUsed,
      classesResolved: roomsUsed,
      // Rough rule of thumb: one new class section needs roughly one additional teacher.
      estimatedAdditionalTeachers: roomsUsed,
      feasibilityRank: suggestions.length + 1,
      tradeoff: candidate.tradeoff,
    });
    remaining -= roomsUsed;
  }

  return suggestions;
}
