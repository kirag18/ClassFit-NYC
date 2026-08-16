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
    <div className="h-full w-full rounded-2xl bg-white/5 animate-pulse flex items-center justify-center text-white/35 text-sm">
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
    <div className="flex-1 flex flex-col mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Find a school
        </h1>
        <p className="text-sm text-white/50 mt-1 max-w-3xl">
          Search by school name or DBN, or browse the map. Color shows how far each school is from
          the class size mandate cap — for most schools, by average class size; for high schools
          where classrooms can physically fit everyone under cap, by real room shortfall instead
          (see each school&apos;s page for why).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.8"
            stroke="currentColor"
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by school name or DBN (e.g. PS 8, 13K008)…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60 [&>option]:bg-[#1a1330] [&>option]:text-white"
        >
          <option value="gap-desc">Sort: Most overcrowded first</option>
          <option value="name-asc">Sort: School name (A-Z)</option>
          <option value="district">Sort: District</option>
        </select>
      </div>

      <div className="panel px-4 py-3">
        <ComplianceLegend />
      </div>

      {sourceYears.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3.5 py-2.5 text-xs text-amber-200">
          <strong className="text-amber-100">Data vintage:</strong> class size figures are from{" "}
          {sourceYears.join(" and ")} — the most recent school-level reports NYC Open Data
          publishes. They predate the class size mandate&apos;s phase-in, so these are historical
          baselines, not current compliance status.
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm px-3.5 py-2.5">
          {error}
        </div>
      )}

      {/* Height is bounded so the two panes scroll independently. Without this
          the list grows to fit every school and stretches the map to match --
          with ~1,500 schools that produced a ~90,000px-tall map. */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-320px)] min-h-[520px]">
        <div className="panel overflow-y-auto h-full">
          {!schools && !error && (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}
          {schools && filtered.length === 0 && (
            <div className="p-6 text-sm text-white/50 text-center">
              No schools match &quot;{query}&quot;.
            </div>
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
        <div className="panel overflow-hidden h-full min-h-[400px] p-1.5">
          {schools ? (
            <SchoolMap schools={filtered} highlightedDbn={hovered} />
          ) : (
            <div className="h-full w-full rounded-xl bg-white/5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
