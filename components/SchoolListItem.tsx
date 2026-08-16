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
      className={`block px-3 py-2.5 rounded-xl border transition-colors ${
        active ? "border-white/20 bg-white/10" : "border-transparent hover:bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-white text-sm truncate">{school.name}</div>
          <div className="text-xs text-white/45">
            {school.dbn} &middot; District {school.district} &middot; {school.borough}
          </div>
        </div>
        <span
          className="mt-0.5 shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${status.color}26`, color: status.color }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
          {school.physicalCapacityCheck
            ? formatPhysicalCapacityGap(school.physicalCapacityCheck)
            : status.tier === "compliant"
              ? "OK"
              : formatGap(school.maxGap)}
        </span>
      </div>
      {school.isDeficitFlagged && (
        <div className="mt-1 text-[11px] text-red-300 bg-red-500/10 inline-block px-1.5 py-0.5 rounded">
          NYCPS confirmed space deficit
        </div>
      )}
    </Link>
  );
}
