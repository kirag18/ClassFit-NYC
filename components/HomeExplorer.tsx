"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { SchoolSummary } from "@/lib/types";
import ComplianceLegend from "./ComplianceLegend";
import SchoolListItem from "./SchoolListItem";
import { InfoIcon, SearchIcon } from "./icons";

// Leaflet touches `window`, so the map must be client-only with SSR disabled.
const SchoolMap = dynamic(() => import("./SchoolMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-lg bg-paper-sunk flex items-center justify-center text-ink-soft text-sm">
      Loading map
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
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Find a school</h1>
        <p className="text-sm text-ink-soft mt-1.5 max-w-3xl leading-relaxed">
          Search by school name or DBN, or browse the map. Color shows how far each school sits from
          the class size mandate cap. For most schools that means average class size; for high
          schools whose classrooms can physically fit everyone under cap, it means real room
          shortfall instead. Each school&apos;s page says which one applies.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by school name or DBN, for example PS 8 or 13K008"
            className="w-full rounded-lg border border-line bg-paper pl-10 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        >
          <option value="gap-desc">Sort: most overcrowded first</option>
          <option value="name-asc">Sort: school name (A to Z)</option>
          <option value="district">Sort: district</option>
        </select>
      </div>

      <ComplianceLegend />

      {sourceYears.length > 0 && (
        <div className="flex gap-2.5 rounded-lg border border-line bg-paper-sunk px-3.5 py-2.5 text-xs text-ink-soft leading-relaxed">
          <InfoIcon className="w-4 h-4 shrink-0 mt-px text-ink-soft" />
          <p>
            <span className="font-semibold text-ink">Data vintage:</span> class size figures are from{" "}
            {sourceYears.join(" and ")}, the most recent school-level reports NYC Open Data
            publishes. They predate the class size mandate&apos;s phase-in, so treat them as
            historical baselines rather than current compliance status.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3.5 py-2.5">
          {error}
        </div>
      )}

      {/* Height is bounded so the two panes scroll independently. Without this
          the list grows to fit every school and stretches the map to match:
          with ~1,500 schools that produced a ~90,000px-tall map. */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-320px)] min-h-[520px]">
        <div className="panel overflow-y-auto h-full">
          {!schools && !error && (
            <div className="p-3 space-y-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-paper-sunk animate-pulse" />
              ))}
            </div>
          )}
          {schools && filtered.length === 0 && (
            <div className="p-6 text-sm text-ink-soft text-center">
              No schools match &quot;{query}&quot;.
            </div>
          )}
          {schools && (
            <div className="p-1.5 space-y-0.5">
              {filtered.map((s) => (
                <div
                  key={s.dbn}
                  onMouseEnter={() => setHovered(s.dbn)}
                  onMouseLeave={() => setHovered(null)}
                >
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
            <div className="h-full w-full rounded-lg bg-paper-sunk animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
