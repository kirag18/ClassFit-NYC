import Link from "next/link";
import type { NearbyCapacityOption, SiteCandidate } from "@/lib/queries";

/**
 * The two levers that don't live inside one building: sending students to a
 * nearby school that has room (medium), and building new seats (slow).
 *
 * Rendered under the Space Toolkit on the school page rather than on a page of
 * their own -- they're the continuation of the same question, and splitting
 * them off meant nobody saw them.
 */
export default function LongerTermSolutions({
  nearbyOptions,
  siteCandidates,
}: {
  nearbyOptions: NearbyCapacityOption[];
  siteCandidates: SiteCandidate[];
}) {
  const totalSpare = nearbyOptions.reduce((sum, o) => sum + o.spareStudents, 0);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- MEDIUM -- */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="text-base font-semibold text-white">
            Nearby schools with room
          </h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200">
            Weeks–1 semester
          </span>
        </div>
        <p className="text-sm text-white/50 mb-4">
          Same school type, within 3 miles, under 90% building utilization — and with real headroom
          left in the classes they already run.
        </p>

        {nearbyOptions.length === 0 ? (
          <p className="text-sm text-white/50">
            No schools of the same type within 3 miles have room to take students without pushing
            their own classes over cap.
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-white">
                  {totalSpare.toLocaleString()}
                </span>
                <span className="text-sm text-white/80">
                  students could be absorbed across {nearbyOptions.length} nearby school
                  {nearbyOptions.length === 1 ? "" : "s"} without any of them going over cap
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2 space-y-2">
              {nearbyOptions.map((o) => (
                <div key={o.school.dbn} className="panel p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/school/${o.school.dbn}`}
                        className="text-sm font-medium text-violet-300 hover:underline"
                      >
                        {o.school.name}
                      </Link>
                      <div className="text-xs text-white/50">
                        {o.school.dbn} · District {o.school.district}
                        {o.sameDistrict ? " (same district)" : ""} · {o.utilizationPct}% utilized
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-300">
                      room for ~{o.spareStudents.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-white/65 mt-1.5">
                    ~{o.distanceMiles} mi away · ~{o.estimatedCommuteMinutes} min added commute
                    {o.buildingIsBinding && (
                      <>
                        {" "}
                        · capped by building capacity ({o.buildingHeadroom.toLocaleString()} spare
                        seats), not class size
                      </>
                    )}
                    {o.usedCourseSeatConversion && !o.buildingIsBinding && (
                      <> · converted from course seats using this school&apos;s own course load</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-xs text-white/50 italic mt-3">
          Capacity is <strong>cap × classes − students</strong> per grade band, at each band&apos;s
          own cap (20 K-3, 23 4-8, 25 high school), then bounded by the building&apos;s Blue Book
          capacity. High school figures are course seats, so they&apos;re divided by that
          school&apos;s real courses-per-student before being reported as children. Labeled{" "}
          <strong>technically feasible, not a recommendation</strong> — rezoning carries real costs
          for families, and a seat existing is not the same as a family accepting it.
        </p>
      </section>

      {/* ------------------------------------------------------------ SLOW -- */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="text-base font-semibold text-white">New construction</h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-300">
            3–5+ years
          </span>
        </div>
        <p className="text-sm text-white/50 mb-4">
          The most durable fix, and the slowest — dependent on capital funding, site approval, and
          construction. No SCA capital plan project is loaded for this school — supply capital plan
          data to show funded seat additions and real timelines here.
        </p>

        {siteCandidates.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-white/90 mb-1.5">
              Unused city-owned land nearby worth investigating
            </h3>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-xs text-amber-200 mb-2">
              <strong>Illustrative starting points only</strong> — not a siting recommendation. Real
              siting runs through SCA Real Estate Services, a 45-day public comment period, and
              Community Board / CEC hearings.
              <div className="mt-1.5">
                <strong>On the addresses:</strong> these come from the city&apos;s COLP dataset,
                which often records only a street name with no house number — and sometimes nothing
                at all. Every parcel below therefore also carries its{" "}
                <strong>BBL (Borough-Block-Lot)</strong>, the city&apos;s authoritative parcel ID,
                and its coordinates. Searching the BBL on{" "}
                <a
                  href="https://zola.planning.nyc.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  ZoLa
                </a>{" "}
                or the Digital Tax Map will pin the exact lot even when the address is vague.
              </div>
            </div>

            <div className="space-y-2">
              {siteCandidates.map((p) => (
                <div key={p.parcel_id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-sm font-medium text-white">
                      {p.description ?? (
                        <span className="text-white/50 italic">No address recorded in COLP</span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-white/50">~{p.distanceMiles} mi away</span>
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {[p.borough, p.ownership].filter(Boolean).join(" · ")}
                  </div>

                  <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex gap-1.5">
                      <dt className="text-white/50 shrink-0">BBL:</dt>
                      <dd className="font-mono text-white/90">{p.bbl ?? "—"}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-white/50 shrink-0">Coordinates:</dt>
                      <dd className="font-mono text-white/90">
                        {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-300 hover:underline"
                    >
                      Open in Maps →
                    </a>
                    {p.bbl && (
                      <a
                        href={`https://zola.planning.nyc.gov/l/lot/${p.bbl.slice(0, 1)}/${Number(
                          p.bbl.slice(1, 6)
                        )}/${Number(p.bbl.slice(6))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-300 hover:underline"
                      >
                        View lot on ZoLa →
                      </a>
                    )}
                  </div>

                  <div className="text-xs text-white/50 mt-1.5">
                    {p.lot_sqft && p.estimatedSeats
                      ? `${p.lot_sqft.toLocaleString()} sqft lot · very roughly ~${p.estimatedSeats.toLocaleString()} seats if built out`
                      : "Lot area isn't published in COLP, so buildable capacity is unknown — check the BBL on ZoLa for the lot dimensions."}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ------------------------------------------------------- ADMIN GUIDE -- */}
      <section className="panel p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">
            Process &amp; policy: exemptions, staffing, restructuring
          </h2>
          <p className="text-sm text-white/50">
            How to file for a class-size exemption, what the expedited resolution timeline requires,
            staffing funds and pay differentials, and capital requests.
          </p>
        </div>
        <Link
          href="/admin-guide"
          className="shrink-0 inline-flex items-center rounded-xl bg-black/40 text-white text-sm font-medium px-4 py-2 hover:bg-black/60"
        >
          Administrator guide →
        </Link>
      </section>
    </div>
  );
}
