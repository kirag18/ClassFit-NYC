import { getComplianceStatus } from "@/lib/compliance";

const TIERS = [0, 1, 3, 6]; // sample gap value inside each tier

export default function ComplianceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
      <span className="font-medium text-white/85">Compliance gap:</span>
      {TIERS.map((gap) => {
        const status = getComplianceStatus(gap);
        return (
          <span key={status.tier} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: status.color, boxShadow: `0 0 8px ${status.color}80` }}
            />
            {status.label}
          </span>
        );
      })}
    </div>
  );
}
