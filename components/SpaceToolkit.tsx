"use client";

import { useMemo, useState } from "react";
import type { ClassSizeRecord, CapacityDetailRow } from "@/lib/types";
import {
  findSplitCandidates,
  findImplausibleRooms,
  summarizeSplitPlan,
  totalInstructionalSeats,
  cafeteriaCapacityFromSqft,
  STUDENTS_PER_PIECE,
  SQFT_PER_CAFETERIA_SEAT,
  MIN_SQFT_PER_PUPIL,
  MIN_SQFT_PER_PUPIL_KINDERGARTEN,
  MAX_PLAUSIBLE_ROOM_SQFT,
} from "@/lib/roomSplit";
import { calculateExtendedDay } from "@/lib/schedule";
import {
  calculateTeacherNeed,
  DEFAULT_SECTIONS_PER_TEACHER,
  AVG_TEACHER_SALARY,
  CITYWIDE_TEACHER_ESTIMATE,
} from "@/lib/teachers";
import { isCourseSectionBand } from "@/lib/compliance";
import type { FastTrackSuggestion } from "@/lib/solver";

type Tab = "split" | "repurpose" | "schedule" | "teachers";

export default function SpaceToolkit({
  bands,
  capacityDetail,
  cafeteriaSqft,
  enrollment,
  repurposeSuggestions,
}: {
  bands: ClassSizeRecord[];
  capacityDetail: CapacityDetailRow[];
  cafeteriaSqft: number | null;
  /** Real Blue Book headcount for this school. Null when it isn't in the Blue Book. */
  enrollment: number | null;
  /** Computed server-side by lib/solver.ts (needs the building's room inventory). */
  repurposeSuggestions: FastTrackSuggestion[];
}) {
  const [tab, setTab] = useState<Tab>("split");

  // The band with the largest gap drives the cap used for seat math -- it's
  // the binding constraint, and using the loosest cap would overstate seats.
  const worstBand = useMemo(() => {
    if (bands.length === 0) return null;
    return bands.reduce((a, b) =>
      b.avg_class_size - b.target_cap > a.avg_class_size - a.target_cap ? b : a
    );
  }, [bands]);
  const targetCap = worstBand?.target_cap ?? 25;

  // Selection is shared: rooms split in the first tab become seats in the second.
  const [selection, setSelection] = useState<Record<string, number>>({});

  const candidates = useMemo(
    () => findSplitCandidates(capacityDetail, targetCap),
    [capacityDetail, targetCap]
  );
  const implausible = useMemo(() => findImplausibleRooms(capacityDetail), [capacityDetail]);

  return (
    <div>
      <div className="flex gap-1 border-b border-white/10 mb-4">
        {(
          [
            ["split", "Split a room"],
            ["repurpose", "Repurpose a room"],
            ["schedule", "Extend the day"],
            ["teachers", "Teachers needed"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === key
                ? "border-violet-400 text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "split" && (
        <SplitTab
          candidates={candidates}
          implausible={implausible}
          targetCap={targetCap}
          selection={selection}
          setSelection={setSelection}
        />
      )}
      {tab === "repurpose" && <RepurposeTab suggestions={repurposeSuggestions} />}
      {tab === "schedule" && (
        <ScheduleTab
          capacityDetail={capacityDetail}
          cafeteriaSqft={cafeteriaSqft}
          targetCap={targetCap}
          selection={selection}
          enrollment={enrollment}
          bands={bands}
        />
      )}
      {tab === "teachers" && <TeachersTab bands={bands} />}
    </div>
  );
}

/* ---------------------------------------------------------------- split ---- */

function SplitTab({
  candidates,
  implausible,
  targetCap,
  selection,
  setSelection,
}: {
  candidates: ReturnType<typeof findSplitCandidates>;
  implausible: ReturnType<typeof findImplausibleRooms>;
  targetCap: number;
  selection: Record<string, number>;
  setSelection: (s: Record<string, number>) => void;
}) {
  const plan = useMemo(
    () => summarizeSplitPlan(candidates, selection, targetCap),
    [candidates, selection, targetCap]
  );

  if (candidates.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65 space-y-2">
          <p className="font-medium text-white/90">
            No rooms in this building are big enough to split
          </p>
          <p>
            Splitting only adds capacity when a room can be divided into at least two pieces of{" "}
            {STUDENTS_PER_PIECE} students each — meaning a measured area of about{" "}
            {(STUDENTS_PER_PIECE * 2 * MIN_SQFT_PER_PUPIL).toLocaleString()} sqft or more. Every
            measured room here is below that, or is a room type that can&apos;t be partitioned
            (auditorium, library, gym, cafeteria).
          </p>
        </div>
        <ImplausibleNotice rooms={implausible} />
      </div>
    );
  }

  const setCount = (key: string, n: number) => setSelection({ ...selection, [key]: n });
  const selectAll = () =>
    setSelection(Object.fromEntries(candidates.map((c) => [c.key, c.room_count])));

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/65">
        A room only ever hosts one section, so it seats no more than the mandate cap of{" "}
        <strong>{targetCap}</strong> — however large it is. Divide an oversized room and each half
        runs its own section, turning unusable floor area into compliant seats. Pick which rooms to
        split and see what it adds.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={selectAll}
          className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/[0.05] backdrop-blur-xl text-xs font-medium text-white/80 hover:bg-white/5"
        >
          Select all splittable rooms
        </button>
        <button
          onClick={() => setSelection({})}
          className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/[0.05] backdrop-blur-xl text-xs font-medium text-white/80 hover:bg-white/5"
        >
          Clear
        </button>
        <span className="text-xs text-white/50 self-center">
          {candidates.length} splittable room group{candidates.length === 1 ? "" : "s"} — scroll the
          list
        </span>
      </div>

      {/* Bounded so a building with dozens of splittable room groups doesn't
          push the running total -- and everything below it -- off the page. */}
      <div className="max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2 space-y-2">
        {candidates.map((c) => {
          const selected = Math.min(c.room_count, Math.floor(selection[c.key] ?? 0));
          return (
            <div
              key={c.key}
              className={`rounded-xl border p-3 ${
                selected > 0 ? "border-sky-500/30 bg-sky-500/10" : "border-white/10 bg-white/[0.05] backdrop-blur-xl"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-sm font-medium text-white">{c.room_type}</span>
                  <span className="text-xs text-white/50 ml-2">
                    {c.sqft.toLocaleString()} sqft · {c.room_count} room
                    {c.room_count === 1 ? "" : "s"} this size
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-300">
                  +{c.seatsGainedPerRoom} seats per room
                </span>
              </div>

              <div className="text-xs text-white/65 mb-2">
                Fits {c.physicalCapacity} by floor area, but seats only{" "}
                <strong>{c.seatsNow}</strong> today (one section, capped at {targetCap}). Split{" "}
                {c.pieces} ways → {c.pieces} × {STUDENTS_PER_PIECE} ={" "}
                <strong>{c.seatsAfter} seats</strong>.
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-white/65">Split</span>
                <input
                  type="range"
                  min={0}
                  max={c.room_count}
                  value={selected}
                  onChange={(e) => setCount(c.key, Number(e.target.value))}
                  className="flex-1 max-w-[200px] accent-violet-400"
                />
                <span className="text-xs font-medium text-white tabular-nums w-16">
                  {selected} of {c.room_count}
                </span>
                {selected > 0 && (
                  <span className="text-xs font-semibold text-emerald-300 tabular-nums">
                    +{selected * c.seatsGainedPerRoom} seats
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          plan.seatsGained > 0 ? "border-emerald-500/25 bg-emerald-500/10" : "border-white/10 bg-white/5"
        }`}
      >
        {plan.seatsGained > 0 ? (
          <>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-white">+{plan.seatsGained}</span>
              <span className="text-sm text-white/80">
                seats from splitting {plan.roomsSplit} room{plan.roomsSplit === 1 ? "" : "s"} — the
                equivalent of{" "}
                <strong>
                  {plan.classroomEquivalents.toFixed(1)} full classroom
                  {plan.classroomEquivalents === 1 ? "" : "s"}
                </strong>{" "}
                at the cap of {targetCap}.
              </span>
            </div>
            <p className="text-sm text-white/65 mt-1">
              Net room count rises by {plan.roomsAdded} (each split room becomes several).
            </p>
          </>
        ) : (
          <p className="text-sm text-white/65">
            Select rooms above to see how many seats splitting them would add.
          </p>
        )}
      </div>

      <ImplausibleNotice rooms={implausible} />

      <p className="text-xs text-white/50 italic">
        Rough feasibility only, from measured floor area at {MIN_SQFT_PER_PUPIL} sqft/pupil (
        {MIN_SQFT_PER_PUPIL_KINDERGARTEN} for kindergarten). No NYC dataset publishes a per-room
        seat count, so capacity is derived from area. A real split also needs egress, HVAC,
        lighting, and electrical review, plus SCA sign-off — and no allowance is subtracted here
        for the wall itself.
      </p>
    </div>
  );
}

/**
 * Oversized records set aside by MAX_PLAUSIBLE_ROOM_SQFT. Shown rather than
 * dropped silently: a school looking at its own building should be able to see
 * that the city's data has a 14,000 sqft "science lab" in it, and decide for
 * itself whether that's a wing worth surveying.
 */
function ImplausibleNotice({ rooms }: { rooms: ReturnType<typeof findImplausibleRooms> }) {
  if (rooms.length === 0) return null;
  const total = rooms.reduce((sum, r) => sum + r.room_count, 0);

  return (
    <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-xs text-amber-200">
      <strong>
        {total} room{total === 1 ? "" : "s"} excluded as too large to be one room
      </strong>{" "}
      — over {MAX_PLAUSIBLE_ROOM_SQFT.toLocaleString()} sqft each:{" "}
      {rooms
        .slice(0, 4)
        .map((r) => `${r.room_type} ${r.sqft.toLocaleString()} sqft`)
        .join(", ")}
      {rooms.length > 4 ? `, +${rooms.length - 4} more` : ""}. In the city&apos;s room data these
      are usually a whole floor or wing recorded under one room number, not a single space anyone
      could wall in half. Worth checking against a floor plan — if one really is a single open
      room, it may be a genuine opportunity this tool is skipping.
    </div>
  );
}

/* ------------------------------------------------------------ repurpose ---- */

/**
 * A different lever from splitting: hand a whole specialty room over to core
 * instruction for some periods, rather than dividing an oversized one. Ranked
 * least-disruptive-first by a greedy walk in lib/solver.ts.
 */
function RepurposeTab({ suggestions }: { suggestions: FastTrackSuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65 space-y-2">
        <p className="font-medium text-white/90">Nothing to repurpose here</p>
        <p>
          Either this school already runs enough sections to stay under cap, or its building has no
          specialty rooms (library, art, music, labs) recorded that could take a core class.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/65">
        The fastest capacity in most buildings is a room that already exists and is used for
        something else. These are ordered least-disruptive first — each one costs a program
        something, which is why the trade-off is named.
      </p>

      <div className="space-y-2">
        {suggestions.map((s) => (
          <div key={s.id} className="panel p-3">
            <div className="flex items-start gap-2 mb-1">
              <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded bg-black/40 text-white">
                #{s.feasibilityRank}
              </span>
              <span className="text-sm font-medium text-white">{s.title}</span>
            </div>
            <p className="text-xs text-white/65 mb-1.5">{s.description}</p>
            <div className="text-xs text-white/50 mb-1">
              Resolves {s.classesResolved} class{s.classesResolved === 1 ? "" : "es"} · ~
              {s.estimatedAdditionalTeachers} additional teacher
              {s.estimatedAdditionalTeachers === 1 ? "" : "s"} to staff them
            </div>
            <p className="text-xs text-white/50 italic">Trade-off: {s.tradeoff}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-white/50 italic">
        A greedy heuristic, not an optimizer: it walks room types in a fixed order and takes the
        least-disruptive available option first, so it finds a fast, explainable plan rather than
        provably the best one. Room counts come from the Blue Book, which reports specialty rooms in
        aggregate — confirm locally which programs would actually be displaced.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- schedule ---- */

function ScheduleTab({
  capacityDetail,
  cafeteriaSqft,
  targetCap,
  selection,
  enrollment,
  bands,
}: {
  capacityDetail: CapacityDetailRow[];
  cafeteriaSqft: number | null;
  targetCap: number;
  selection: Record<string, number>;
  enrollment: number | null;
  bands: ClassSizeRecord[];
}) {
  const [periodsInDay, setPeriodsInDay] = useState(8);
  const [periodsPerStudent, setPeriodsPerStudent] = useState(6);

  const { seats: classroomSeats, rooms: roomCount } = useMemo(
    () => totalInstructionalSeats(capacityDetail, targetCap, selection),
    [capacityDetail, targetCap, selection]
  );
  const baseline = useMemo(
    () => totalInstructionalSeats(capacityDetail, targetCap, {}),
    [capacityDetail, targetCap]
  );
  const seatsFromSplits = classroomSeats - baseline.seats;

  const derivedCaf = cafeteriaCapacityFromSqft(cafeteriaSqft);
  const [cafeteriaCapacity, setCafeteriaCapacity] = useState(derivedCaf);

  // HS band totals are course seats, not headcount, so they can't stand in for
  // enrollment here -- only the Blue Book figure is a real student count.
  const bandStudentTotal = bands.reduce((sum, b) => sum + b.num_students, 0);
  const headcountAvailable = enrollment != null;
  const [totalStudents, setTotalStudents] = useState(
    enrollment ?? (bands.some((b) => isCourseSectionBand(b.grade_band)) ? 0 : bandStudentTotal)
  );

  const result = useMemo(
    () =>
      calculateExtendedDay({
        periodsInDay,
        periodsPerStudent,
        totalStudents,
        classroomSeats,
        cafeteriaCapacity,
      }),
    [periodsInDay, periodsPerStudent, totalStudents, classroomSeats, cafeteriaCapacity]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/65">
        If the building runs more periods than any one student&apos;s schedule fills, cohorts can
        start at staggered times and share the same rooms across a longer day. The limit is the
        middle of the day, when every cohort is on site at once — everyone has to be in a classroom
        or at lunch. Lunch only absorbs one period&apos;s worth of students at a time, since each
        student eats once.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="block text-white/65 mb-1">Periods offered in the day (P)</span>
          <input
            type="number"
            min={1}
            value={periodsInDay}
            onChange={(e) => setPeriodsInDay(Number(e.target.value))}
            className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          />
        </label>
        <label className="text-sm">
          <span className="block text-white/65 mb-1">Periods per student&apos;s schedule (L)</span>
          <input
            type="number"
            min={1}
            value={periodsPerStudent}
            onChange={(e) => setPeriodsPerStudent(Number(e.target.value))}
            className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          />
        </label>
        <label className="text-sm">
          <span className="block text-white/65 mb-1">Total students (N)</span>
          <input
            type="number"
            min={0}
            value={totalStudents}
            onChange={(e) => setTotalStudents(Number(e.target.value))}
            className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          />
          <span className="block text-xs text-white/35 mt-1">
            {headcountAvailable
              ? "Blue Book enrollment for this school."
              : "Not in the Blue Book — enter the real headcount."}
          </span>
        </label>
        <label className="text-sm">
          <span className="block text-white/65 mb-1">Cafeteria capacity (Caf)</span>
          <input
            type="number"
            min={0}
            value={cafeteriaCapacity}
            onChange={(e) => setCafeteriaCapacity(Number(e.target.value))}
            className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          />
          <span className="block text-xs text-white/35 mt-1">
            {cafeteriaSqft
              ? `${cafeteriaSqft.toLocaleString()} sqft ÷ ${SQFT_PER_CAFETERIA_SEAT} sqft/person = ${derivedCaf}. A legal ceiling, not installed seats.`
              : "No cafeteria on record for this building."}
          </span>
        </label>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65">
        <strong className="text-white/90">Classroom seats: {classroomSeats.toLocaleString()}</strong>{" "}
        across {roomCount.toLocaleString()} instructional rooms — each room&apos;s own measured
        capacity, capped at {targetCap}.
        {seatsFromSplits > 0 && (
          <> Includes +{seatsFromSplits} from the splits selected in &quot;Split a room&quot;.</>
        )}{" "}
        Gym, auditorium, and cafeteria are excluded here; the cafeteria is counted separately above.
      </div>

      {result.invalid ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
          A student&apos;s schedule (L = {periodsPerStudent}) can&apos;t be longer than the day
          itself (P = {periodsInDay}). Raise P or lower L.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="panel p-3">
              <div className="text-2xl font-bold text-white">{result.cohorts}</div>
              <div className="text-xs text-white/65">
                staggered cohorts possible (P − L + 1)
              </div>
            </div>
            <div className="panel p-3">
              <div className="text-2xl font-bold text-white">
                {Math.max(0, result.overlapPeriods)}
              </div>
              <div className="text-xs text-white/65">
                periods where all cohorts overlap (2L − P)
              </div>
            </div>
          </div>

          {result.noFullOverlap ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <strong>Fits by construction.</strong> With {periodsInDay} periods and{" "}
              {periodsPerStudent}-period schedules, no single period has every cohort on site — the
              earliest cohort has left before the latest arrives. Peak load is never the full
              enrollment, so the building&apos;s seat count doesn&apos;t bind.
            </div>
          ) : (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                result.fits
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/25 bg-red-500/10 text-red-300"
              }`}
            >
              {result.fits ? (
                <strong>Fits, with {result.slack.toLocaleString()} seats to spare.</strong>
              ) : (
                <strong>Short by {result.shortfall.toLocaleString()} seats.</strong>
              )}{" "}
              During the {result.overlapPeriods} overlap period
              {result.overlapPeriods === 1 ? "" : "s"} all {totalStudents.toLocaleString()} students
              are on site at once, and the building holds{" "}
              {result.available.toLocaleString()} — {classroomSeats.toLocaleString()} in classrooms
              plus {result.studentsAtLunch.toLocaleString()} at lunch.
              {!result.fits && " Lengthening the day (raising P) shrinks the overlap window and can close this."}
              <p className="mt-1.5 text-xs opacity-80">
                A student eats once, so lunch spreads over those{" "}
                {result.overlapPeriods} period{result.overlapPeriods === 1 ? "" : "s"}:{" "}
                {result.lunchDemandPerPeriod.toLocaleString()} students need it per period
                {result.cafeteriaSaturated ? (
                  <>
                    , more than the cafeteria&apos;s {cafeteriaCapacity.toLocaleString()} — so it
                    runs full every period and only takes {result.studentsAtLunch.toLocaleString()}{" "}
                    off the classrooms.
                  </>
                ) : (
                  <>
                    , within the cafeteria&apos;s {cafeteriaCapacity.toLocaleString()}, so it holds
                    all {result.studentsAtLunch.toLocaleString()} of them. Only that many are ever
                    out of a classroom at once — not the room&apos;s full capacity.
                  </>
                )}
              </p>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-white/50 italic">
        A peak-load check, not a bell schedule: it says whether everyone fits at the busiest moment,
        not how sections map to rooms and periods. Staggered days also disrupt family routines,
        transportation, after-school programs, and staff contracts — a serious lever, not a quick
        fix.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- teachers ---- */

function TeachersTab({ bands }: { bands: ClassSizeRecord[] }) {
  const [sectionsPerTeacher, setSectionsPerTeacher] = useState(DEFAULT_SECTIONS_PER_TEACHER);

  const rows = useMemo(
    () =>
      bands.map((b) => ({
        band: b,
        result: calculateTeacherNeed({
          numStudents: b.num_students,
          currentSections: b.num_classes,
          targetCap: b.target_cap,
          sectionsPerTeacher,
        }),
      })),
    [bands, sectionsPerTeacher]
  );

  const totalTeachers = rows.reduce((sum, r) => sum + r.result.additionalTeachers, 0);
  const totalSections = rows.reduce((sum, r) => sum + r.result.additionalSections, 0);
  const totalCost = totalTeachers * AVG_TEACHER_SALARY;

  if (bands.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
        No class size data on file for this school, so section and staffing needs can&apos;t be
        estimated.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/65">
        Compliance is bought in sections: every grade band needs enough of them that no class runs
        over cap. Teachers follow from sections — but not one-to-one, since a teacher covers several
        sections a day.
      </p>

      <label className="text-sm block max-w-xs">
        <span className="block text-white/65 mb-1">Sections one teacher covers per day</span>
        <input
          type="number"
          min={1}
          value={sectionsPerTeacher}
          onChange={(e) => setSectionsPerTeacher(Number(e.target.value))}
          className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60"
        />
        <span className="block text-xs text-white/35 mt-1">
          Default {DEFAULT_SECTIONS_PER_TEACHER}: the UFT high school programmed day is 5 teaching
          periods plus a professional period and a prep. Elementary and middle assignments differ.
        </span>
      </label>

      <div className="space-y-2">
        {rows.map(({ band, result }) => (
          <div key={band.grade_band} className="panel p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium text-white">Grades {band.grade_band}</span>
              <span className="text-xs text-white/50">
                cap {band.target_cap} · currently {band.num_classes.toLocaleString()}{" "}
                {isCourseSectionBand(band.grade_band) ? "core sections" : "classes"} averaging{" "}
                {result.currentAvgClassSize.toFixed(1)}
              </span>
            </div>

            {result.alreadyCompliant ? (
              <p className="text-sm text-emerald-300">
                Already runs enough sections ({result.sectionsNeeded.toLocaleString()} needed,{" "}
                {band.num_classes.toLocaleString()} running) — no additional hiring implied.
              </p>
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                <span className="text-white/80">
                  Needs <strong>{result.sectionsNeeded.toLocaleString()}</strong> sections →{" "}
                  <strong className="text-white">
                    +{result.additionalSections.toLocaleString()}
                  </strong>{" "}
                  to create
                </span>
                <span className="text-white/80">
                  ÷ {sectionsPerTeacher} per teacher ={" "}
                  <strong className="text-white">
                    {result.additionalTeachers.toLocaleString()} teacher
                    {result.additionalTeachers === 1 ? "" : "s"}
                  </strong>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          totalTeachers > 0 ? "border-orange-500/25 bg-orange-500/10" : "border-emerald-500/25 bg-emerald-500/10"
        }`}
      >
        {totalTeachers > 0 ? (
          <>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-white">{totalTeachers}</span>
              <span className="text-sm text-white/80">
                additional teacher{totalTeachers === 1 ? "" : "s"} to cover{" "}
                {totalSections.toLocaleString()} new section
                {totalSections === 1 ? "" : "s"} across all grade bands
              </span>
            </div>
            <p className="text-sm text-white/80 mt-1">
              Very roughly <strong>${(totalCost / 1_000_000).toFixed(2)}M</strong> a year at an
              assumed ${AVG_TEACHER_SALARY.toLocaleString()} average base salary.
            </p>
          </>
        ) : (
          <p className="text-sm text-emerald-200">
            Every grade band already runs enough sections to stay under cap — no additional hiring
            implied by class size alone.
          </p>
        )}
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/65">
        <strong className="text-white/90">Scale check:</strong> NYCPS has estimated needing{" "}
        {CITYWIDE_TEACHER_ESTIMATE.low.toLocaleString()}–
        {CITYWIDE_TEACHER_ESTIMATE.high.toLocaleString()} additional teachers to fully comply with
        the law citywide. A single school&apos;s figure should be a small fraction of that — useful
        for sanity-checking the order of magnitude, not for comparing schools.
      </div>

      <p className="text-xs text-white/50 italic">
        The salary figure is one flat constant for order-of-magnitude only. Real cost depends on
        each hire&apos;s step and differentials, and pension, health, and payroll taxes add roughly
        another 35–45% on top of base that this doesn&apos;t include. It also assumes teachers can
        be hired at all — in shortage licence areas that is the binding constraint, not money.
      </p>
    </div>
  );
}
