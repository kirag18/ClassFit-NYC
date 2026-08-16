"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { SchoolSummary } from "@/lib/types";
import ComplianceLegend from "./ComplianceLegend";
import SchoolListItem from "./SchoolListItem";

// Leaflet touches `window`, so the map must be client-only with SSR disabled.
const SchoolMap = dynamic(() => import("./SchoolMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-sm">
      Loading map…
    </div>
  ),
});

type SortKey = "gap-desc" | "name-asc" | "district";

export default function HomeExplorer() {
  const [schools, setSchools] = useState<SchoolSummary[] | null>(null);
  const [sourceYears, setSourceYears] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("gap-desc");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/schools")
      .then((r) => {
        if (!r.ok) throw new Error("Request failed");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSchools(data.schools);
        setSourceYears(data.sourceYears ?? []);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Couldn't load school data. Run `npm run fetch:real && npm run load:data` (or `npm run setup:data` for mock data), then reload."
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!schools) return [];
    const q = query.trim().toLowerCase();
    let list = schools;
    if (q) {
      list = schools.filter(
        (s) => s.name.toLowerCase().includes(q) || s.dbn.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === "gap-desc") sorted.sort((a, b) => b.maxGap - a.maxGap);
    else if (sort === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => a.district - b.district || a.name.localeCompare(b.name));
    return sorted;
  }, [schools, query, sort]);

  return (
    <div className="flex-1 flex flex-col mx-auto max-w-7xl w-full px-6 py-5 gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Find a school</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Search by school name or DBN, or browse the map. Color shows how far each school is from
          the class size mandate cap — for most schools, by average class size; for high schools
          where classrooms can physically fit everyone under cap, by real room shortfall instead
          (see each school&apos;s page for why).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by school name or DBN (e.g. PS 8, 13K008)…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="gap-desc">Sort: Most overcrowded first</option>
          <option value="name-asc">Sort: School name (A-Z)</option>
          <option value="district">Sort: District</option>
        </select>
      </div>

      <ComplianceLegend />

      {sourceYears.length > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
          <strong>Data vintage:</strong> class size figures are from{" "}
          {sourceYears.join(" and ")} — the most recent school-level reports NYC Open Data
          publishes. They predate the class size mandate&apos;s phase-in, so these are historical
          baselines, not current compliance status.
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Height is bounded so the two panes scroll independently. Without this
          the list grows to fit every school and stretches the map to match --
          with ~1,500 schools that produced a ~90,000px-tall map. */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-280px)] min-h-[520px]">
        <div className="border border-slate-200 rounded-lg bg-white overflow-y-auto h-full">
          {!schools && !error && (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-md bg-slate-100 animate-pulse" />
              ))}
            </div>
          )}
          {schools && filtered.length === 0 && (
            <div className="p-6 text-sm text-slate-500 text-center">No schools match &quot;{query}&quot;.</div>
          )}
          {schools && (
            <div className="p-2 space-y-1">
              {filtered.map((s) => (
                <div key={s.dbn} onMouseEnter={() => setHovered(s.dbn)} onMouseLeave={() => setHovered(null)}>
                  <SchoolListItem school={s} active={hovered === s.dbn} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg overflow-hidden border border-slate-200 h-full min-h-[400px]">
          {schools ? (
            <SchoolMap schools={filtered} highlightedDbn={hovered} />
          ) : (
            <div className="h-full w-full bg-slate-100 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
