import Link from "next/link";
import type { NearbyCapacityOption, SiteCandidate, SchoolCapacityProjects } from "@/lib/queries";
import type { CapacityProject } from "@/lib/types";
import { AlertIcon, ArrowRightIcon, ExternalIcon } from "./icons";

/** Google Maps link for a project, by coordinates when known, else by address. */
function mapsHref(p: CapacityProject): string | null {
  if (p.lat != null && p.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  }
  if (p.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${p.address}, ${p.borough ?? "New York"}, NY`
    )}`;
  }
  return null;
}

/**
 * The three levers that don't live inside one building: sending students to a
 * nearby school that has room (medium), funded construction already moving
 * through the SCA pipeline, and speculative sites that would still need
 * funding (both slow).
 *
 * Rendered under the Space Toolkit on the school page rather than on a page of
 * their own -- they're the continuation of the same question, and splitting
 * them off meant nobody saw them.
 */
export default function LongerTermSolutions({
  nearbyOptions,
  siteCandidates,
  capacityProjects,
  buildingShortfall,
}: {
  nearbyOptions: NearbyCapacityOption[];
  siteCandidates: SiteCandidate[];
  capacityProjects: SchoolCapacityProjects;
  /**
   * Students this building is over its Blue Book target capacity today, or
   * null when there's no Blue Book row to compare against. Used only to say
   * whether a funded expansion actually closes the gap.
   */
  buildingShortfall: number | null;
}) {
  const totalSpare = nearbyOptions.reduce((sum, o) => sum + o.spareStudents, 0);
  const { direct, directSeats, nearby } = capacityProjects;

  return (
    <div className="space-y-5">
      {/* ---------------------------------------------------------- MEDIUM -- */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Nearby schools with room</h2>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900">
            Weeks to one semester
          </span>
        </div>
        <p className="text-sm text-ink-soft mt-1 mb-4 leading-relaxed">
          Same school type, within 3 miles, under 90% building utilization, and with real headroom
          left in the classes they already run.
        </p>

        {nearbyOptions.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No schools of the same type within 3 miles have room to take students without pushing
            their own classes over cap.
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-line bg-paper-sunk p-4 mb-3">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl font-semibold text-ink tabular-nums tracking-tight">
                  {totalSpare.toLocaleString()}
                </span>
                <span className="text-sm text-ink-soft flex-1 min-w-[14rem] leading-relaxed">
                  students could be absorbed across {nearbyOptions.length} nearby school
                  {nearbyOptions.length === 1 ? "" : "s"} without any of them going over cap
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-lg border border-line p-2 space-y-2">
              {nearbyOptions.map((o) => (
                <div key={o.school.dbn} className="rounded-lg border border-line p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/school/${o.school.dbn}`}
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        {o.school.name}
                      </Link>
                      <div className="text-xs text-ink-soft mt-0.5">
                        {o.school.dbn}, District {o.school.district}
                        {o.sameDistrict ? " (same district)" : ""}, {o.utilizationPct}% utilized
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-700 tabular-nums">
                      room for about {o.spareStudents.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-ink-soft mt-2 leading-relaxed">
                    About {o.distanceMiles} mi away, roughly {o.estimatedCommuteMinutes} min added
                    commute
                    {o.buildingIsBinding && (
                      <>
                        . Capped by building capacity ({o.buildingHeadroom.toLocaleString()} spare
                        seats), not class size
                      </>
                    )}
                    {o.usedCourseSeatConversion && !o.buildingIsBinding && (
                      <>. Converted from course seats using this school&apos;s own course load</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-xs text-ink-soft leading-relaxed border-t border-line mt-4 pt-3">
          Capacity is <strong className="text-ink font-semibold">cap × classes − students</strong>{" "}
          per grade band, at each band&apos;s own cap (20 for K-3, 23 for 4-8, 25 for high school),
          then bounded by the building&apos;s Blue Book capacity. High school figures are course
          seats, so they are divided by that school&apos;s real courses-per-student before being
          reported as children. This is{" "}
          <strong className="text-ink font-semibold">
            technically feasible, not a recommendation
          </strong>
          . Rezoning carries real costs for families, and a seat existing is not the same as a family
          accepting it.
        </p>
      </section>

      {/* ------------------------------------------------------------ SLOW -- */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">New construction</h2>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-800">
            3 to 5+ years
          </span>
        </div>
        <p className="text-sm text-ink-soft mt-1 mb-4 leading-relaxed">
          The most durable fix and the slowest, dependent on capital funding, site approval, and
          construction. Projects below are already in the School Construction Authority&apos;s
          pipeline, with a funded seat count and an anticipated opening year.
        </p>

        {/* --- Direct: seats landing in THIS school's building ---------------- */}
        {direct.length > 0 ? (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Direct expansion of this school
            </span>
            <div className="flex items-baseline gap-2.5 flex-wrap mt-2">
              <span className="text-3xl font-semibold text-ink tabular-nums tracking-tight">
                +{directSeats.toLocaleString()}
              </span>
              <span className="text-sm text-ink-soft flex-1 min-w-[14rem] leading-relaxed">
                funded seats are being added to this school across {direct.length}{" "}
                {direct.length === 1 ? "project" : "projects"}
              </span>
            </div>
            {buildingShortfall != null && buildingShortfall > 0 && (
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                This building is{" "}
                <strong className="text-ink font-semibold">
                  {buildingShortfall.toLocaleString()} students
                </strong>{" "}
                over its Blue Book target capacity today, so the funded seats{" "}
                {directSeats >= buildingShortfall ? (
                  <>
                    more than cover the gap on paper, though they arrive only when the project
                    opens and say nothing about class size within the building.
                  </>
                ) : (
                  <>
                    close about {Math.round((directSeats / buildingShortfall) * 100)}% of it,
                    leaving roughly{" "}
                    {(buildingShortfall - directSeats).toLocaleString()} students still above
                    capacity.
                  </>
                )}
              </p>
            )}

            <div className="mt-3 space-y-2">
              {direct.map((p) => (
                <div key={p.project_id} className="rounded-lg border border-emerald-200 bg-paper p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-ink">{p.name}</div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-700 tabular-nums">
                      +{p.seats.toLocaleString()} seats
                    </span>
                  </div>
                  <div className="text-xs text-ink-soft mt-1">
                    {[
                      p.anticipated_opening ? `Anticipated opening ${p.anticipated_opening}` : null,
                      p.address,
                      p.borough,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                  {mapsHref(p) && (
                    <a
                      href={mapsHref(p)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-accent hover:underline"
                    >
                      Open site in Maps
                      <ExternalIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-lg border border-line bg-paper-sunk px-4 py-3 text-sm text-ink-soft">
            <span className="font-semibold text-ink">No funded expansion for this school.</span> This
            school does not appear in the SCA&apos;s capacity projects in process, so no addition or
            annex is currently scheduled for its building.
          </div>
        )}

        {/* --- Nearby: seats landing in the area, not this school ------------- */}
        {nearby.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-ink mb-1">
              Capacity projects nearby, not seats for this school
            </h3>
            <p className="text-xs text-ink-soft mb-2 leading-relaxed">
              Within 3 miles. New buildings can draw enrollment away from this school over time, and
              an annex on a neighbouring school frees room in the same catchment, but none of these
              seats are allocated here.
            </p>
            <div className="space-y-2">
              {nearby.map((p) => (
                <div key={p.project_id} className="rounded-lg border border-line p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink">{p.name}</div>
                      <div className="text-xs text-ink-soft mt-0.5">
                        {[
                          p.anticipated_opening ? `Opens ${p.anticipated_opening}` : null,
                          `about ${p.distanceMiles} mi away`,
                          p.address,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-ink tabular-nums">
                        +{p.seats.toLocaleString()} seats
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          p.project_type === "expansion"
                            ? "bg-sky-50 border border-sky-200 text-sky-800"
                            : "bg-violet-50 border border-violet-200 text-violet-800"
                        }`}
                      >
                        {p.project_type === "expansion" ? "Expansion" : "New school"}
                      </span>
                    </div>
                  </div>
                  {p.project_type === "expansion" && p.matched_school_name && (
                    <div className="text-xs text-ink-soft mt-1.5">
                      Adds seats to{" "}
                      {p.dbn ? (
                        <Link href={`/school/${p.dbn}`} className="text-accent font-medium hover:underline">
                          {p.matched_school_name}
                        </Link>
                      ) : (
                        p.matched_school_name
                      )}
                      .
                    </div>
                  )}
                  {p.project_type === "new_school" && (
                    <div className="text-xs text-ink-soft mt-1.5">
                      A new building with no school assigned yet. SCA names these for their address
                      until a school is sited in them.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {direct.length === 0 && nearby.length === 0 && (
          <p className="text-sm text-ink-soft mb-4">
            No SCA capacity project is in process within 3 miles of this school.
          </p>
        )}

        <p className="text-xs text-ink-soft leading-relaxed mb-5">
          Source: NYC Open Data{" "}
          <a
            href="https://data.cityofnewyork.us/d/dtmw-avzj"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            Capacity Projects in Process Site Locations
            <ExternalIcon className="w-3.5 h-3.5" />
          </a>{" "}
          (School Construction Authority). Seat counts and opening years are the SCA&apos;s own
          figures and shift as projects move through design and construction. Expansions are matched
          to schools by project name and site location; the SCA file carries no DBN.
        </p>

        {siteCandidates.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-ink mb-2">
              Unused city-owned land nearby worth investigating
            </h3>
            <div className="flex gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-3 text-xs text-amber-900 mb-3 leading-relaxed">
              <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p>
                  <span className="font-semibold">Illustrative starting points only</span>, not a
                  siting recommendation. Real siting runs through SCA Real Estate Services, a 45-day
                  public comment period, and Community Board or CEC hearings.
                </p>
                <p className="mt-1.5">
                  <span className="font-semibold">On the addresses:</span> these come from the
                  city&apos;s COLP dataset, which often records only a street name with no house
                  number, and sometimes nothing at all. Every parcel below therefore also carries its{" "}
                  <strong className="font-semibold">BBL (Borough-Block-Lot)</strong>, the city&apos;s
                  authoritative parcel ID, and its coordinates. Searching the BBL on{" "}
                  <a
                    href="https://zola.planning.nyc.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    ZoLa
                  </a>{" "}
                  or the Digital Tax Map will pin the exact lot even when the address is vague.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {siteCandidates.map((p) => (
                <div key={p.parcel_id} className="rounded-lg border border-line p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-ink">
                      {p.description ?? (
                        <span className="text-ink-soft font-normal italic">
                          No address recorded in COLP
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                      about {p.distanceMiles} mi away
                    </span>
                  </div>
                  <div className="text-xs text-ink-soft mt-0.5">
                    {[p.borough, p.ownership].filter(Boolean).join(", ")}
                  </div>

                  <dl className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1 text-xs">
                    <div className="flex gap-1.5">
                      <dt className="text-ink-soft shrink-0">BBL</dt>
                      <dd className="font-mono text-ink">{p.bbl ?? "not recorded"}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-ink-soft shrink-0">Coordinates</dt>
                      <dd className="font-mono text-ink">
                        {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-2.5 flex flex-wrap gap-4 text-xs">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                    >
                      Open in Maps
                      <ExternalIcon className="w-3.5 h-3.5" />
                    </a>
                    {p.bbl && (
                      <a
                        href={`https://zola.planning.nyc.gov/l/lot/${p.bbl.slice(0, 1)}/${Number(
                          p.bbl.slice(1, 6)
                        )}/${Number(p.bbl.slice(6))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                      >
                        View lot on ZoLa
                        <ExternalIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="text-xs text-ink-soft mt-2 leading-relaxed">
                    {p.lot_sqft && p.estimatedSeats
                      ? `${p.lot_sqft.toLocaleString()} sqft lot, very roughly ${p.estimatedSeats.toLocaleString()} seats if built out`
                      : "Lot area isn't published in COLP, so buildable capacity is unknown. Check the BBL on ZoLa for the lot dimensions."}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ------------------------------------------------------- ADMIN GUIDE -- */}
      <section className="panel p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">
            Process and policy: exemptions, staffing, restructuring
          </h2>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            How to file for a class-size exemption, what the expedited resolution timeline requires,
            staffing funds and pay differentials, and capital requests.
          </p>
        </div>
        <Link
          href="/admin-guide"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent text-white text-sm font-semibold px-4 py-2.5 hover:opacity-90 transition-opacity"
        >
          Administrator guide
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
