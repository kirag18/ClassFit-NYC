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
import { AlertIcon, InfoIcon } from "./icons";

type Tab = "split" | "repurpose" | "schedule" | "teachers";

/* Shared bits of chrome, so every tab reads as the same surface. ------------ */

const FIELD =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink tabular-nums focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function Field({
  label,
  note,
  ...input
}: { label: string; note?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      <input type="number" className={FIELD} {...input} />
      {note && <span className="block text-xs text-ink-soft mt-1 leading-relaxed">{note}</span>}
    </label>
  );
}

/** Neutral block for methodology caveats that sit under a tab's results. */
function Caveat({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-ink-soft leading-relaxed border-t border-line pt-3">{children}</p>
  );
}

/** Callout with a leading icon. Tone drives colour; default is neutral. */
function Note({
  tone = "neutral",
  icon = "info",
  children,
}: {
  tone?: "neutral" | "warn" | "good" | "bad";
  icon?: "info" | "alert";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-line bg-paper-sunk text-ink",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    bad: "border-red-200 bg-red-50 text-red-800",
  };
  const Icon = icon === "alert" ? AlertIcon : InfoIcon;
  return (
    <div className={`flex gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** The big number that answers each tab's question. */
function Headline({
  value,
  children,
  tone = "neutral",
}: {
  value: string;
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn";
}) {
  const tones = {
    neutral: "border-line bg-paper-sunk",
    good: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
  };
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="text-3xl font-semibold text-ink tabular-nums tracking-tight">{value}</span>
        <span className="text-sm text-ink-soft leading-relaxed flex-1 min-w-[14rem]">{children}</span>
      </div>
    </div>
  );
}

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
      <div className="flex gap-1 border-b border-line mb-5 -mx-1 overflow-x-auto">
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
            className={`px-3 py-2 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === key
                ? "border-accent text-accent font-semibold"
                : "border-transparent text-ink-soft font-medium hover:text-ink"
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
      <div className="space-y-4">
        <Note>
          <p className="font-semibold text-ink">
            No rooms in this building are big enough to split
          </p>
          <p className="mt-1 text-ink-soft">
            Splitting only adds capacity when a room can be divided into at least two pieces of{" "}
            {STUDENTS_PER_PIECE} students each, meaning a measured area of about{" "}
            {(STUDENTS_PER_PIECE * 2 * MIN_SQFT_PER_PUPIL).toLocaleString()} sqft or more. Every
            measured room here is below that, or is a room type that can&apos;t be partitioned:
            auditorium, library, gym, cafeteria.
          </p>
        </Note>
        <ImplausibleNotice rooms={implausible} />
      </div>
    );
  }

  const setCount = (key: string, n: number) => setSelection({ ...selection, [key]: n });
  const selectAll = () =>
    setSelection(Object.fromEntries(candidates.map((c) => [c.key, c.room_count])));

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft leading-relaxed">
        A room only ever hosts one section, so it seats no more than the mandate cap of{" "}
        <strong className="text-ink font-semibold">{targetCap}</strong>, however large it is. Divide
        an oversized room and each half runs its own section, turning unusable floor area into
        compliant seats. Pick which rooms to split and see what it adds.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={selectAll}
          className="px-3 py-1.5 rounded-lg border border-line bg-paper text-xs font-medium text-ink hover:bg-paper-sunk"
        >
          Select all splittable rooms
        </button>
        <button
          onClick={() => setSelection({})}
          className="px-3 py-1.5 rounded-lg border border-line bg-paper text-xs font-medium text-ink hover:bg-paper-sunk"
        >
          Clear
        </button>
        <span className="text-xs text-ink-soft">
          {candidates.length} splittable room group{candidates.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Bounded so a building with dozens of splittable room groups doesn't
          push the running total -- and everything below it -- off the page. */}
      <div className="max-h-80 overflow-y-auto rounded-lg border border-line p-2 space-y-2">
        {candidates.map((c) => {
          const selected = Math.min(c.room_count, Math.floor(selection[c.key] ?? 0));
          return (
            <div
              key={c.key}
              className={`rounded-lg border p-3 transition-colors ${
                selected > 0 ? "border-accent bg-accent-soft" : "border-line bg-paper"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-sm font-semibold text-ink">{c.room_type}</span>
                  <span className="text-xs text-ink-soft ml-2 tabular-nums">
                    {c.sqft.toLocaleString()} sqft, {c.room_count} room
                    {c.room_count === 1 ? "" : "s"} this size
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  +{c.seatsGainedPerRoom} seats per room
                </span>
              </div>

              <div className="text-xs text-ink-soft mb-2.5 leading-relaxed">
                Fits {c.physicalCapacity} by floor area, but seats only{" "}
                <strong className="text-ink font-semibold">{c.seatsNow}</strong> today (one section,
                capped at {targetCap}). Split {c.pieces} ways for {c.pieces} ×{" "}
                {STUDENTS_PER_PIECE} ={" "}
                <strong className="text-ink font-semibold">{c.seatsAfter} seats</strong>.
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-soft">Split</span>
                <input
                  type="range"
                  min={0}
                  max={c.room_count}
                  value={selected}
                  onChange={(e) => setCount(c.key, Number(e.target.value))}
                  className="flex-1 max-w-[200px] accent-accent"
                />
                <span className="text-xs font-medium text-ink tabular-nums w-16">
                  {selected} of {c.room_count}
                </span>
                {selected > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                    +{selected * c.seatsGainedPerRoom} seats
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {plan.seatsGained > 0 ? (
        <Headline value={`+${plan.seatsGained}`} tone="good">
          seats from splitting {plan.roomsSplit} room{plan.roomsSplit === 1 ? "" : "s"}, the
          equivalent of{" "}
          <strong className="text-ink font-semibold">
            {plan.classroomEquivalents.toFixed(1)} full classroom
            {plan.classroomEquivalents === 1 ? "" : "s"}
          </strong>{" "}
          at the cap of {targetCap}. Net room count rises by {plan.roomsAdded}, since each split room
          becomes several.
        </Headline>
      ) : (
        <Note>Select rooms above to see how many seats splitting them would add.</Note>
      )}

      <ImplausibleNotice rooms={implausible} />

      <Caveat>
        Rough feasibility only, from measured floor area at {MIN_SQFT_PER_PUPIL} sqft per pupil (
        {MIN_SQFT_PER_PUPIL_KINDERGARTEN} for kindergarten). No NYC dataset publishes a per-room seat
        count, so capacity is derived from area. A real split also needs egress, HVAC, lighting, and
        electrical review, plus SCA sign-off, and no allowance is subtracted here for the wall
        itself.
      </Caveat>
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
    <Note tone="warn" icon="alert">
      <p>
        <span className="font-semibold">
          {total} room{total === 1 ? "" : "s"} excluded as too large to be one room
        </span>
        , over {MAX_PLAUSIBLE_ROOM_SQFT.toLocaleString()} sqft each:{" "}
        {rooms
          .slice(0, 4)
          .map((r) => `${r.room_type} ${r.sqft.toLocaleString()} sqft`)
          .join(", ")}
        {rooms.length > 4 ? `, and ${rooms.length - 4} more` : ""}.
      </p>
      <p className="mt-1.5">
        In the city&apos;s room data these are usually a whole floor or wing recorded under one room
        number, not a single space anyone could wall in half. Worth checking against a floor plan: if
        one really is a single open room, it may be a genuine opportunity this tool is skipping.
      </p>
    </Note>
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
      <Note>
        <p className="font-semibold text-ink">Nothing to repurpose here</p>
        <p className="mt-1 text-ink-soft">
          Either this school already runs enough sections to stay under cap, or its building has no
          specialty rooms (library, art, music, labs) recorded that could take a core class.
        </p>
      </Note>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft leading-relaxed">
        The fastest capacity in most buildings is a room that already exists and is used for
        something else. These are ordered least-disruptive first. Each one costs a program
        something, which is why the trade-off is named.
      </p>

      <div className="space-y-2">
        {suggestions.map((s) => (
          <div key={s.id} className="rounded-lg border border-line p-3.5">
            <div className="flex items-start gap-2.5 mb-1.5">
              <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded bg-accent-soft text-accent tabular-nums">
                {s.feasibilityRank}
              </span>
              <span className="text-sm font-semibold text-ink">{s.title}</span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">{s.description}</p>
            <div className="text-xs text-ink-soft mt-1.5">
              Resolves {s.classesResolved} class{s.classesResolved === 1 ? "" : "es"}, about{" "}
              {s.estimatedAdditionalTeachers} additional teacher
              {s.estimatedAdditionalTeachers === 1 ? "" : "s"} to staff them
            </div>
            <p className="text-xs text-ink-soft mt-1">
              <span className="font-medium text-ink">Trade-off:</span> {s.tradeoff}
            </p>
          </div>
        ))}
      </div>

      <Caveat>
        A greedy heuristic, not an optimizer: it walks room types in a fixed order and takes the
        least-disruptive available option first, so it finds a fast, explainable plan rather than
        provably the best one. Room counts come from the Blue Book, which reports specialty rooms in
        aggregate, so confirm locally which programs would actually be displaced.
      </Caveat>
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
      <p className="text-sm text-ink-soft leading-relaxed">
        If the building runs more periods than any one student&apos;s schedule fills, cohorts can
        start at staggered times and share the same rooms across a longer day. The limit is the
        middle of the day, when every cohort is on site at once and everyone has to be in a
        classroom or at lunch. Lunch only absorbs one period&apos;s worth of students at a time,
        since each student eats once.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Periods offered in the day (P)"
          min={1}
          value={periodsInDay}
          onChange={(e) => setPeriodsInDay(Number(e.target.value))}
        />
        <Field
          label="Periods per student's schedule (L)"
          min={1}
          value={periodsPerStudent}
          onChange={(e) => setPeriodsPerStudent(Number(e.target.value))}
        />
        <Field
          label="Total students (N)"
          min={0}
          value={totalStudents}
          onChange={(e) => setTotalStudents(Number(e.target.value))}
          note={
            headcountAvailable
              ? "Blue Book enrollment for this school."
              : "Not in the Blue Book, so enter the real headcount."
          }
        />
        <Field
          label="Cafeteria capacity (Caf)"
          min={0}
          value={cafeteriaCapacity}
          onChange={(e) => setCafeteriaCapacity(Number(e.target.value))}
          note={
            cafeteriaSqft
              ? `${cafeteriaSqft.toLocaleString()} sqft ÷ ${SQFT_PER_CAFETERIA_SEAT} sqft per person = ${derivedCaf}. A legal ceiling, not installed seats.`
              : "No cafeteria on record for this building."
          }
        />
      </div>

      <Note>
        <span className="font-semibold text-ink">
          Classroom seats: {classroomSeats.toLocaleString()}
        </span>{" "}
        across {roomCount.toLocaleString()} instructional rooms, using each room&apos;s own measured
        capacity capped at {targetCap}.
        {seatsFromSplits > 0 && (
          <> That includes +{seatsFromSplits} from the splits selected in &quot;Split a room&quot;.</>
        )}{" "}
        Gym, auditorium, and cafeteria are excluded here; the cafeteria is counted separately above.
      </Note>

      {result.invalid ? (
        <Note tone="warn" icon="alert">
          A student&apos;s schedule (L = {periodsPerStudent}) can&apos;t be longer than the day
          itself (P = {periodsInDay}). Raise P or lower L.
        </Note>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-line p-3.5">
              <div className="text-2xl font-semibold text-ink tabular-nums">{result.cohorts}</div>
              <div className="text-xs text-ink-soft mt-0.5">
                staggered cohorts possible (P − L + 1)
              </div>
            </div>
            <div className="rounded-lg border border-line p-3.5">
              <div className="text-2xl font-semibold text-ink tabular-nums">
                {Math.max(0, result.overlapPeriods)}
              </div>
              <div className="text-xs text-ink-soft mt-0.5">
                periods where all cohorts overlap (2L − P)
              </div>
            </div>
          </div>

          {result.noFullOverlap ? (
            <Note tone="good">
              <span className="font-semibold">Fits by construction.</span> With {periodsInDay}{" "}
              periods and {periodsPerStudent}-period schedules, no single period has every cohort on
              site: the earliest cohort has left before the latest arrives. Peak load is never the
              full enrollment, so the building&apos;s seat count doesn&apos;t bind.
            </Note>
          ) : (
            <Note tone={result.fits ? "good" : "bad"} icon={result.fits ? "info" : "alert"}>
              <p>
                {result.fits ? (
                  <span className="font-semibold">
                    Fits, with {result.slack.toLocaleString()} seats to spare.
                  </span>
                ) : (
                  <span className="font-semibold">
                    Short by {result.shortfall.toLocaleString()} seats.
                  </span>
                )}{" "}
                During the {result.overlapPeriods} overlap period
                {result.overlapPeriods === 1 ? "" : "s"} all {totalStudents.toLocaleString()}{" "}
                students are on site at once, and the building holds{" "}
                {result.available.toLocaleString()}: {classroomSeats.toLocaleString()} in classrooms
                plus {result.studentsAtLunch.toLocaleString()} at lunch.
                {!result.fits &&
                  " Lengthening the day (raising P) shrinks the overlap window and can close this."}
              </p>
              <p className="mt-1.5 text-xs opacity-80">
                A student eats once, so lunch spreads over those {result.overlapPeriods} period
                {result.overlapPeriods === 1 ? "" : "s"}:{" "}
                {result.lunchDemandPerPeriod.toLocaleString()} students need it per period
                {result.cafeteriaSaturated ? (
                  <>
                    , more than the cafeteria&apos;s {cafeteriaCapacity.toLocaleString()}, so it runs
                    full every period and only takes {result.studentsAtLunch.toLocaleString()} off
                    the classrooms.
                  </>
                ) : (
                  <>
                    , within the cafeteria&apos;s {cafeteriaCapacity.toLocaleString()}, so it holds
                    all {result.studentsAtLunch.toLocaleString()} of them. Only that many are ever
                    out of a classroom at once, not the room&apos;s full capacity.
                  </>
                )}
              </p>
            </Note>
          )}
        </>
      )}

      <Caveat>
        A peak-load check, not a bell schedule: it says whether everyone fits at the busiest moment,
        not how sections map to rooms and periods. Staggered days also disrupt family routines,
        transportation, after-school programs, and staff contracts, so this is a serious lever rather
        than a quick fix.
      </Caveat>
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
      <Note>
        No class size data on file for this school, so section and staffing needs can&apos;t be
        estimated.
      </Note>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft leading-relaxed">
        Compliance is bought in sections: every grade band needs enough of them that no class runs
        over cap. Teachers follow from sections, but not one-to-one, since a teacher covers several
        sections a day.
      </p>

      <div>
        <div className="max-w-[10rem]">
          <Field
            label="Sections one teacher covers per day"
            min={1}
            value={sectionsPerTeacher}
            onChange={(e) => setSectionsPerTeacher(Number(e.target.value))}
          />
        </div>
        <p className="text-xs text-ink-soft mt-1.5 leading-relaxed max-w-2xl">
          Default {DEFAULT_SECTIONS_PER_TEACHER}: the UFT high school programmed day is 5 teaching
          periods plus a professional period and a prep. Elementary and middle assignments differ.
        </p>
      </div>

      <div className="space-y-2">
        {rows.map(({ band, result }) => (
          <div key={band.grade_band} className="rounded-lg border border-line p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
              <span className="text-sm font-semibold text-ink">Grades {band.grade_band}</span>
              <span className="text-xs text-ink-soft tabular-nums">
                cap {band.target_cap}, currently {band.num_classes.toLocaleString()}{" "}
                {isCourseSectionBand(band.grade_band) ? "core sections" : "classes"} averaging{" "}
                {result.currentAvgClassSize.toFixed(1)}
              </span>
            </div>

            {result.alreadyCompliant ? (
              <p className="text-sm text-emerald-700">
                Already runs enough sections ({result.sectionsNeeded.toLocaleString()} needed,{" "}
                {band.num_classes.toLocaleString()} running), so no additional hiring is implied.
              </p>
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-ink-soft">
                <span>
                  Needs{" "}
                  <strong className="text-ink font-semibold">
                    {result.sectionsNeeded.toLocaleString()}
                  </strong>{" "}
                  sections, so{" "}
                  <strong className="text-ink font-semibold">
                    +{result.additionalSections.toLocaleString()}
                  </strong>{" "}
                  to create
                </span>
                <span>
                  ÷ {sectionsPerTeacher} per teacher ={" "}
                  <strong className="text-ink font-semibold">
                    {result.additionalTeachers.toLocaleString()} teacher
                    {result.additionalTeachers === 1 ? "" : "s"}
                  </strong>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalTeachers > 0 ? (
        <Headline value={totalTeachers.toLocaleString()} tone="warn">
          additional teacher{totalTeachers === 1 ? "" : "s"} to cover{" "}
          {totalSections.toLocaleString()} new section{totalSections === 1 ? "" : "s"} across all
          grade bands. Very roughly{" "}
          <strong className="text-ink font-semibold">
            ${(totalCost / 1_000_000).toFixed(2)}M
          </strong>{" "}
          a year at an assumed ${AVG_TEACHER_SALARY.toLocaleString()} average base salary.
        </Headline>
      ) : (
        <Note tone="good">
          Every grade band already runs enough sections to stay under cap, so no additional hiring is
          implied by class size alone.
        </Note>
      )}

      <Note>
        <span className="font-semibold text-ink">Scale check:</span> NYCPS has estimated needing{" "}
        {CITYWIDE_TEACHER_ESTIMATE.low.toLocaleString()} to{" "}
        {CITYWIDE_TEACHER_ESTIMATE.high.toLocaleString()} additional teachers to fully comply with
        the law citywide. A single school&apos;s figure should be a small fraction of that, which
        makes it useful for sanity-checking the order of magnitude but not for comparing schools.
      </Note>

      <Caveat>
        The salary figure is one flat constant for order-of-magnitude only. Real cost depends on each
        hire&apos;s step and differentials, and pension, health, and payroll taxes add roughly
        another 35 to 45% on top of base that this doesn&apos;t include. It also assumes teachers can
        be hired at all: in shortage licence areas that is the binding constraint, not money.
      </Caveat>
    </div>
  );
}
