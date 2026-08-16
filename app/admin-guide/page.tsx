import Link from "next/link";
import { AlertIcon, ArrowLeftIcon, ExternalIcon } from "@/components/icons";

export const metadata = {
  title: "Administrator guide, ClassFit NYC",
};

interface Source {
  label: string;
  url: string;
}

function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="mt-4 pt-3 border-t border-line">
      <div className="text-xs font-semibold text-ink mb-1.5">Sources</div>
      <ul className="space-y-1">
        {sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-1.5 text-xs text-accent hover:underline"
            >
              <span>{s.label}</span>
              <ExternalIcon className="w-3.5 h-3.5 shrink-0 mt-px" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({
  title,
  timeline,
  children,
  sources,
}: {
  title: string;
  timeline: string;
  children: React.ReactNode;
  sources: Source[];
}) {
  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-paper-sunk border border-line text-ink-soft">
          {timeline}
        </span>
      </div>
      <div className="text-sm text-ink-soft space-y-3 leading-relaxed [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
      <SourceList sources={sources} />
    </section>
  );
}

export default function AdminGuidePage() {
  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-6 space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to map and search
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Administrator guide</h1>
        <p className="text-sm text-ink-soft mt-1.5 max-w-3xl leading-relaxed">
          Process and policy options for school leaders working on class size compliance:
          exemptions, staffing, restructuring, and capital requests.
        </p>
      </div>

      <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed">
        <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Verify before acting.</span> This is a plain-language
          summary compiled from public NYCPS, NYSED, UFT, and news sources, with links below each
          section. Policy here changed materially in 2026 and continues to evolve. Confirm current
          requirements and deadlines with your superintendent, borough office, or the NYCPS class
          size team before filing anything.
        </p>
      </div>

      <Section
        title="Know the current compliance timeline"
        timeline="Updated June 2026"
        sources={[
          {
            label: "Chalkbeat: NYC to get 2-year extension to comply with state class size law",
            url: "https://www.chalkbeat.org/newyork/2026/06/01/nyc-class-size-law-delay-albany-uft-deal/",
          },
          {
            label: "NY State Senate: Addabbo announces new law providing NYC additional time",
            url: "https://www.nysenate.gov/newsroom/press-releases/2026/joseph-p-addabbo-jr/addabbo-announces-new-law-provide-new-york-city",
          },
          {
            label: "NYCPS: FY26 Class Size Reduction Plan",
            url: "https://pwsblobprd.schools.nyc/prd-pws/docs/default-source/default-document-library/fy26-class-size-reduction-plan-final.pdf?sfvrsn=72fcdcc0_2",
          },
        ]}
      >
        <p>
          The 2022 state class size law caps classes at 20 students (K-3), 23 (grades 4-8), and 25
          (high school). Compliance is measured <em>citywide</em> as a percentage of classes that
          meet the caps, not school by school.
        </p>
        <p>
          In June 2026 the state extended full compliance from September 2028 to September 2030. The
          phase-in benchmarks are now roughly <strong>70% for 2026-27</strong>, 80% for 2027-28, 90%
          for 2028-29, and 100% by 2029-30.
        </p>
        <p>
          Practically: your school does not have to hit 100% on its own next year. The question is
          whether your classes count toward the citywide percentage, or fall under an exemption.
        </p>
      </Section>

      <Section
        title="Understand the four exemption categories"
        timeline="Annual cycle"
        sources={[
          {
            label: "NYCPS InfoHub: Class Size FAQ (Fall 2024-25)",
            url: "https://infohub.nyced.org/docs/default-source/default-document-library/class-size-faq-fall-2024-2025-updated-11-6-24.pdf",
          },
          {
            label: "UFT: Class size FAQ",
            url: "https://www.uft.org/get-involved/uft-campaigns/reduce-class-sizes/class-size-faq",
          },
          {
            label:
              "Chalkbeat: NYC quietly exempts thousands of classrooms from state class size law",
            url: "https://www.chalkbeat.org/newyork/2025/11/18/nyc-officials-approve-thousands-of-exemptions-to-state-class-size-law/",
          },
        ]}
      >
        <p>The law recognizes four exemption categories:</p>
        <ul className="space-y-2 pl-5 list-disc marker:text-line-strong">
          <li>
            <strong>Space.</strong> The building physically lacks room to comply. Critically, this
            must be paired with a capital plan: exemptions are intended for schools where{" "}
            <em>capital projects are already planned and sited</em> to resolve the deficit.
          </li>
          <li>
            <strong>Over-enrollment.</strong> The school enrolled more students than planned, for
            example through mid-year arrivals or mandated placements.
          </li>
          <li>
            <strong>License-area shortage.</strong> No certified teacher is available in the needed
            subject or license area.
          </li>
          <li>
            <strong>Severe economic distress.</strong> Full implementation would create genuine
            fiscal hardship.
          </li>
        </ul>
        <p>
          If you are pursuing a <strong>space</strong> exemption, expect to document the capital
          side. A space claim without a corresponding capital request is the weakest version of the
          argument, because the law explicitly ties space constraints to capital budget targeting.
        </p>
      </Section>

      <Section
        title="Resolve oversized classes: the expedited timeline"
        timeline="First 21 school days"
        sources={[
          {
            label: "UFT: Contract, expedited process for class size",
            url: "https://www.uft.org/your-rights/contracts/2019-2022-contract-glance/contract-2019-22-expedited-process-class-size",
          },
          {
            label:
              "UFT: Teachers union seeks arbitration orders to reduce chronically oversize classes",
            url: "https://www.uft.org/news/press-releases/teachers-union-seeks-arbitration-orders-reduce-chronically-oversize-classes",
          },
        ]}
      >
        <p>
          Oversized classes move through a contractual escalation ladder at the start of each year:
        </p>
        <ul className="space-y-2 pl-5 list-disc marker:text-line-strong">
          <li>
            <strong>Days 1 to 10.</strong> Chapter leader and principal work to resolve overages at
            the school level.
          </li>
          <li>
            <strong>Days 10 to 20.</strong> UFT district representative and superintendent take up
            anything unresolved.
          </li>
          <li>
            <strong>By day 21.</strong> The central class size labor-management committee handles
            what remains.
          </li>
          <li>
            <strong>If no agreement.</strong> The law mandates arbitration. Higher class sizes for
            elective and specialty classes can be negotiated if a majority of school staff approve.
          </li>
        </ul>
        <p>
          The practical takeaway: fixes you can execute in the first two weeks, such as room
          reallocation and section rebalancing, keep you out of arbitration. Use the{" "}
          <Link href="/" className="text-accent font-medium hover:underline">
            school pages
          </Link>{" "}
          to identify which bands are over and by how much before day 1.
        </p>
      </Section>

      <Section
        title="Staffing: hiring, funding, and the exemption pay differential"
        timeline="Budget cycle, plan by winter"
        sources={[
          {
            label: "UFT: On the 2026 class size agreement",
            url: "https://www.uft.org/news/press-releases/uft-on-2026-class-size-agreement",
          },
          {
            label:
              "Gothamist: NYC plans new school spaces, teachers to comply with class size law",
            url: "https://gothamist.com/news/nyc-plans-new-school-spaces-teachers-to-comply-with-class-size-law-as-enrollment-drops",
          },
          {
            label: "NYCPS InfoHub: FY26 draft Class Size Reduction Plan",
            url: "https://infohub.nyced.org/docs/default-source/default-document-library/fy26-draft-class-size-reduction-plan-05-20-25.pdf",
          },
        ]}
      >
        <p>
          <strong>Class size funding.</strong> NYCPS has run a process where selected schools receive
          supplemental class-size funds specifically so they can come into compliance without cutting
          existing programs. Schools have historically been notified of selection and projected
          allocation around <strong>the end of February</strong>, so hiring can be planned before
          spring. Ask your superintendent whether your school is in the current selection pool.
        </p>
        <p>
          <strong>Exemption pay differential.</strong> Under the 2026 agreement, teachers in schools
          granted space or hard-to-staff exemptions become eligible for a pay differential when class
          sizes exceed the caps, reported at up to roughly $8,500 in 2026-27 and $9,500 the following
          year. Budget for this. An exemption is not cost-free to the system, and that is deliberate:
          it is designed as pressure toward compliance.
        </p>
      </Section>

      <Section
        title="Restructuring: co-location, grade reconfiguration, and mergers"
        timeline="1 to 2 year planning cycle"
        sources={[
          {
            label: "NYCPS: Campus Governance",
            url: "https://www.schools.nyc.gov/school-life/space-and-facilities/campus-governance",
          },
          {
            label: "NYU Steinhardt: Trends in School Co-Locations in NYC",
            url: "https://steinhardt.nyu.edu/research-alliance/research/spotlight-nyc-schools/trends-school-co-locations-nyc",
          },
          {
            label: "NYC Comptroller: Intentional and Inclusive School Mergers",
            url: "https://comptroller.nyc.gov/reports/intentional-and-inclusive-school-mergers/",
          },
        ]}
      >
        <p>
          More than half of NYC schools already share a campus, and the Office of Campus Governance
          supports 700+ co-located buildings. Chancellor&apos;s Regulation A-190 establishes Building
          Councils wherever two or more schools share a building.
        </p>
        <p>Structural levers that change how many students a building must seat at once:</p>
        <ul className="space-y-2 pl-5 list-disc marker:text-line-strong">
          <li>
            <strong>Grade reconfiguration.</strong> Splitting into PreK-2 and 3-5 campuses, or
            shifting to a K-8 or 6-12 structure, so grade bands with the tightest caps (K-3 at 20)
            are concentrated where the rooms fit them.
          </li>
          <li>
            <strong>Co-location adjustment.</strong> Renegotiating the Building Utilization Plan with
            the Building Council when a co-located partner has slack space.
          </li>
          <li>
            <strong>Merger.</strong> Consolidating under-enrolled schools to free a full building.
            The Comptroller&apos;s office has published guidance on doing this inclusively.
          </li>
        </ul>
        <p>
          These are slow and politically involved. They require community engagement and, for
          co-location changes, public hearings. Start them a full planning cycle ahead.
        </p>
      </Section>

      <Section
        title="Capital requests: getting new seats built"
        timeline="3 to 5+ years"
        sources={[
          {
            label: "NYC School Construction Authority: Fiscal 2025-2029 Five-Year Capital Plan",
            url: "https://council.nyc.gov/budget/wp-content/uploads/sites/54/2026/03/School-Construction-Authority.pdf",
          },
          {
            label: "SCA testimony to City Council on capital planning and site selection",
            url: "https://nyc.legistar.com/View.ashx?GUID=6989DF81-515D-4810-978F-ED8D91E18678&ID=10889487&M=F",
          },
        ]}
      >
        <p>
          New capacity flows through the DOE and SCA Five-Year Capital Plan, which identifies
          enrollment-driven need and guides site acquisition. The current plan funds tens of
          thousands of new seats, concentrated in over-utilized and growth districts, with Brooklyn
          and Queens receiving the largest shares.
        </p>
        <p>
          Site selection runs through SCA Real Estate Services, followed by a{" "}
          <strong>45-day public comment period</strong>, a notice of filing in the City Record, and
          invitations to Community Boards and District CECs to hold hearings.
        </p>
        <p>
          Because space exemptions are meant to pair with planned-and-sited capital projects, getting
          your building into the capital plan is often the thing that makes a space exemption
          defensible. Work through your superintendent and CEC.
        </p>
      </Section>

      <p className="text-xs text-ink-soft leading-relaxed pt-1">
        Compiled August 2026 from public sources. ClassFit NYC is an independent tool and is not
        affiliated with NYC Public Schools, the SCA, NYSED, or the UFT.
      </p>
    </div>
  );
}
