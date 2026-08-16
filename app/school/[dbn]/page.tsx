import { notFound } from "next/navigation";
import Link from "next/link";
import { getSchoolDetail, findNearbyCapacityOptions, findSiteCandidates } from "@/lib/queries";
import {
  getComplianceStatus,
  plainLanguageStatus,
  isCourseSectionBand,
} from "@/lib/compliance";
import { generateFastTrackSuggestions } from "@/lib/solver";
import SpaceToolkit from "@/components/SpaceToolkit";
import LongerTermSolutions from "@/components/LongerTermSolutions";
import { AlertIcon, ArrowLeftIcon, InfoIcon } from "@/components/icons";

/** Small labelled figure used across the two stat rows. */
function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="text-xs text-ink-soft">{label}</div>
      <div className="text-lg font-semibold text-ink tabular-nums mt-0.5">{value}</div>
      {note && <div className="text-xs text-ink-soft mt-0.5">{note}</div>}
    </div>
  );
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ dbn: string }>;
}) {
  const { dbn } = await params;
  const detail = getSchoolDetail(dbn.toUpperCase());
  if (!detail) notFound();

  const { school, bands, building, rooms, capacityDetail, isDeficitFlagged, physicalCapacityCheck } =
    detail;
  const worstBand =
    bands.length > 0
      ? bands.reduce((a, b) => (b.avg_class_size - b.target_cap > a.avg_class_size - a.target_cap ? b : a))
      : null;
  // Where the physical-capacity check applies (single-band HS, real
  // enrollment + room data -- see computeHsPhysicalCapacity), it overrides
  // the badge: severity is driven by real room shortfall, not by how few
  // course sections the school happens to be scheduling today.
  const overallStatus = physicalCapacityCheck
    ? getComplianceStatus(physicalCapacityCheck.classroomsNeeded)
    : getComplianceStatus(worstBand ? worstBand.avg_class_size - worstBand.target_cap : 0);
  // Standard instructional rooms: general classrooms + kindergarten + SPED --
  // i.e. rooms a student is assigned to for core instruction, as opposed to
  // specialty spaces (gym, library, cafeteria, auditorium, labs).
  const STANDARD_ROOM_TYPES = new Set(["Classroom", "Homeroom", "Kindergarten", "Special Education"]);
  const standardRoomCount = rooms
    .filter((r) => STANDARD_ROOM_TYPES.has(r.room_type))
    .reduce((sum, r) => sum + r.room_count, 0);

  const cafeteriaRoom = rooms.find((r) => r.room_type === "Cafeteria");

  // Longer-term levers, computed server-side (all need database access).
  const repurposeSuggestions = generateFastTrackSuggestions(bands, rooms);
  const nearbyOptions = findNearbyCapacityOptions(school.dbn).slice(0, 8);
  const siteCandidates = findSiteCandidates(school.dbn).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-6 space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to map and search
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">{school.name}</h1>
          <p className="text-sm text-ink-soft mt-1">
            {school.dbn}, {school.school_type}, District {school.district}, {school.borough}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${overallStatus.color}1a`, color: overallStatus.color }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: overallStatus.color }}
          />
          {overallStatus.label}
        </span>
      </div>

      {isDeficitFlagged && (
        <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold">NYCPS confirmed space deficit.</span> This school appears
            on NYC Public Schools&apos; own list of buildings with confirmed classroom space
            deficits.
          </p>
        </div>
      )}

      {physicalCapacityCheck && (
        <div
          className={`flex gap-2.5 rounded-lg border px-4 py-3 text-sm ${
            physicalCapacityCheck.feasible
              ? "border-sky-200 bg-sky-50 text-sky-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {physicalCapacityCheck.feasible ? (
            <InfoIcon className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            {physicalCapacityCheck.feasible ? (
              <p>
                <span className="font-semibold">
                  This is a scheduling problem, not a space problem.
                </span>{" "}
                High school class size is reported per course section, and the average below (
                {worstBand?.avg_class_size.toFixed(1)} students per section) reflects too few,
                too-large sections rather than a lack of rooms. This building has{" "}
                {physicalCapacityCheck.roomsCounted} classrooms with a combined capacity of about{" "}
                {physicalCapacityCheck.totalCapacity.toLocaleString()} students at the mandate cap of{" "}
                {physicalCapacityCheck.targetCap}, comfortably above the{" "}
                {physicalCapacityCheck.enrollment.toLocaleString()} students actually enrolled.
                Scheduling more, smaller sections across the rooms already available would bring
                every section under cap without any construction.
              </p>
            ) : (
              <p>
                <span className="font-semibold">
                  This is a real space shortfall, not just a scheduling issue.
                </span>{" "}
                Even spreading all {physicalCapacityCheck.enrollment.toLocaleString()} enrolled
                students across all {physicalCapacityCheck.roomsCounted} classrooms at full
                capacity, this building can only seat about{" "}
                {physicalCapacityCheck.totalCapacity.toLocaleString()} students under the mandate cap
                of {physicalCapacityCheck.targetCap}. That leaves it short by{" "}
                {physicalCapacityCheck.excessStudents.toLocaleString()} students, or roughly{" "}
                {physicalCapacityCheck.classroomsNeeded} more classroom
                {physicalCapacityCheck.classroomsNeeded === 1 ? "" : "s"}.
              </p>
            )}
            <p className="mt-1.5 text-xs opacity-80">
              Based on real Blue Book enrollment and per-room measured floor area (20 sqft per
              pupil), not the course-section average shown below. The room math is in the space
              toolkit.
            </p>
          </div>
        </div>
      )}

      {/* Class size vs. cap by grade band */}
      <section className="panel p-5">
        <h2 className="text-base font-semibold text-ink mb-4">
          Class size against mandate cap, by grade band
        </h2>
        <div className="space-y-5">
          {bands.map((b) => {
            const status = getComplianceStatus(b.avg_class_size - b.target_cap);
            return (
              <div key={b.grade_band}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <span className="font-medium text-ink">
                    Grades {b.grade_band}
                    {b.source_year && (
                      <span className="ml-2 text-xs font-normal text-ink-soft">
                        {b.source_year} data
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-ink-soft tabular-nums">
                    {b.num_classes.toLocaleString()}{" "}
                    {isCourseSectionBand(b.grade_band) ? "core sections" : "classes"},{" "}
                    {b.num_students.toLocaleString()}{" "}
                    {isCourseSectionBand(b.grade_band) ? "student course seats" : "students"}
                  </span>
                </div>
                {isCourseSectionBand(b.grade_band) && (
                  <p className="text-xs text-ink-soft mb-2 leading-relaxed">
                    High school figures count core <em>course sections</em>, so one student taking
                    five core courses appears five times. The average is still seats divided by
                    sections; the totals are not headcount.
                  </p>
                )}
                {b.data_quality === "suspect" && (
                  <div className="mb-2 flex gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    <AlertIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>
                      The source dataset reports an implausible average here (students appear
                      attributed to too few sections). Treat this figure as unreliable.
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="flex-1 h-2 rounded-full bg-paper-sunk overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (b.avg_class_size / (b.target_cap * 1.4)) * 100)}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-ink tabular-nums w-24 text-right">
                    {b.avg_class_size.toFixed(1)} / {b.target_cap}
                  </span>
                </div>
                <p className="text-sm text-ink-soft">
                  {plainLanguageStatus(b.avg_class_size, b.target_cap)}
                </p>
              </div>
            );
          })}
          {bands.length === 0 && (
            <p className="text-sm text-ink-soft">No class size data on file.</p>
          )}
        </div>
      </section>

      {/* Building utilization */}
      <section className="panel p-5">
        <h2 className="text-base font-semibold text-ink mb-4">Building utilization</h2>
        {building ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Utilization" value={`${building.utilization_pct}%`} />
            <Stat
              label={`Building enrollment${building.co_located ? " (shared)" : ""}`}
              value={building.enrollment.toLocaleString()}
            />
            <Stat label="Target capacity" value={building.capacity.toLocaleString()} />
            <Stat
              label="Co-located"
              value={
                building.co_located ? `Yes, ${building.num_schools_in_building} schools` : "No"
              }
            />
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            No Blue Book utilization data on file for this building.
          </p>
        )}

        {/* School-specific stats, as opposed to the building-level figures above. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-line">
          <Stat
            label="This school's enrollment"
            value={school.enrollment != null ? school.enrollment.toLocaleString() : "None"}
            note={school.enrollment == null ? "not in the Blue Book" : undefined}
          />
          <Stat
            label="Standard classrooms"
            value={standardRoomCount > 0 ? standardRoomCount.toLocaleString() : "None"}
            note={standardRoomCount === 0 ? "no room data" : undefined}
          />
          <Stat
            label="Cafeteria size"
            value={cafeteriaRoom?.sqft ? `${cafeteriaRoom.sqft.toLocaleString()} sqft` : "None"}
            note={!cafeteriaRoom?.sqft ? "no cafeteria on record" : undefined}
          />
        </div>
        <p className="text-xs text-ink-soft mt-3">
          Room and cafeteria figures are measured floor area from DOE building space records, not
          headcount. The space toolkit below turns them into capacity.
        </p>
      </section>

      {/* Space toolkit: room splitting, extended day, teacher need */}
      <section className="panel p-5">
        <h2 className="text-base font-semibold text-ink">Space toolkit</h2>
        <p className="text-sm text-ink-soft mt-1 mb-4">
          Where the capacity could come from in the building you already have, and what staffing it
          would take.
        </p>
        <SpaceToolkit
          bands={bands}
          capacityDetail={capacityDetail}
          cafeteriaSqft={cafeteriaRoom?.sqft ?? null}
          enrollment={school.enrollment}
          repurposeSuggestions={repurposeSuggestions}
        />
      </section>

      <LongerTermSolutions nearbyOptions={nearbyOptions} siteCandidates={siteCandidates} />
    </div>
  );
}
