import Link from "next/link";
import type { SchoolSummary } from "@/lib/types";
import { getComplianceStatus, formatGap, formatPhysicalCapacityGap } from "@/lib/compliance";

export default function SchoolListItem({
  school,
  active,
}: {
  school: SchoolSummary;
  active?: boolean;
}) {
  const status = getComplianceStatus(school.maxGap);
  return (
    <Link
      href={`/school/${school.dbn}`}
      className={`block px-3 py-2.5 rounded-lg transition-colors ${
        active ? "bg-accent-soft" : "hover:bg-paper-sunk"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-ink text-sm truncate">{school.name}</div>
          <div className="text-xs text-ink-soft mt-0.5">
            {school.dbn}, District {school.district}, {school.borough}
          </div>
        </div>
        <span
          className="mt-0.5 shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${status.color}1a`, color: status.color }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          {school.physicalCapacityCheck
            ? formatPhysicalCapacityGap(school.physicalCapacityCheck)
            : status.tier === "compliant"
              ? "Within cap"
              : formatGap(school.maxGap)}
        </span>
      </div>
      {school.isDeficitFlagged && (
        <div className="mt-1.5 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 inline-block px-1.5 py-0.5 rounded">
          NYCPS confirmed space deficit
        </div>
      )}
    </Link>
  );
}
