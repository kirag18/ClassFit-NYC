/**
 * Generates mock CSV files shaped like the real NYC Open Data sources this
 * app is designed to ingest:
 *   - school_locations.csv   ~ "DOE School Locations" dataset
 *   - class_size.csv         ~ "NYC DOE Class Size Report" (collapsed to grade bands)
 *   - building_utilization.csv ~ "DOE Blue Book" building capacity/utilization
 *   - space_deficit_schools.csv ~ NYCPS confirmed space-deficit school list
 *   - room_inventory.csv     ~ Blue Book room-type inventory per building
 *
 * Run with: npm run gen:mock
 *
 * When real Open Data CSVs are available, drop them into data/raw/ using the
 * SAME file names + column headers (see README) and re-run `npm run load:data`
 * directly -- this generator is only for producing demo data.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const RAW_DIR = join(process.cwd(), "data", "raw");
mkdirSync(RAW_DIR, { recursive: true });

type GradeBand = "K-3" | "4-8" | "9-12";
const CAPS: Record<GradeBand, number> = { "K-3": 20, "4-8": 23, "9-12": 25 };

interface SchoolDef {
  dbn: string;
  name: string;
  boro: "M" | "X" | "K" | "Q" | "R";
  district: number;
  type: "ES" | "MS" | "HS" | "K8";
  lat: number;
  lng: number;
  buildingId: string;
  bands: { band: GradeBand; avgClassSize: number; numClasses: number }[];
  buildingCapacity: number;
  coLocated: boolean;
  numSchoolsInBuilding: number;
  deficitFlagged: boolean;
  // extra non-homeroom rooms available in the building, for the what-if / solver features
  extraRooms: { type: string; count: number; capacity: number }[];
}

const BORO_NAME: Record<SchoolDef["boro"], string> = {
  M: "Manhattan",
  X: "Bronx",
  K: "Brooklyn",
  Q: "Queens",
  R: "Staten Island",
};

const schools: SchoolDef[] = [
  {
    dbn: "01M034", name: "PS 34 Franklin D. Roosevelt", boro: "M", district: 1, type: "ES",
    lat: 40.7223, lng: -73.9793, buildingId: "M001",
    bands: [{ band: "K-3", avgClassSize: 21, numClasses: 12 }, { band: "4-8", avgClassSize: 24, numClasses: 8 }],
    buildingCapacity: 520, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 1, capacity: 26 }, { type: "Music", count: 1, capacity: 26 }, { type: "Gym", count: 1, capacity: 40 }, { type: "Cafeteria", count: 1, capacity: 120 }, { type: "Library", count: 1, capacity: 30 }],
  },
  {
    dbn: "03M199", name: "PS 199 Jessie Isador Straus", boro: "M", district: 3, type: "ES",
    lat: 40.7870, lng: -73.9754, buildingId: "M034",
    bands: [{ band: "K-3", avgClassSize: 26, numClasses: 14 }, { band: "4-8", avgClassSize: 27, numClasses: 9 }],
    buildingCapacity: 700, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: true,
    extraRooms: [{ type: "Art", count: 1, capacity: 28 }, { type: "Gym", count: 1, capacity: 45 }, { type: "Cafeteria", count: 1, capacity: 140 }, { type: "Science Lab", count: 1, capacity: 28 }],
  },
  {
    dbn: "03M087", name: "PS 87 William Sherman", boro: "M", district: 3, type: "ES",
    lat: 40.7794, lng: -73.9776, buildingId: "M052",
    bands: [{ band: "K-3", avgClassSize: 24, numClasses: 16 }, { band: "4-8", avgClassSize: 25, numClasses: 10 }],
    buildingCapacity: 780, coLocated: true, numSchoolsInBuilding: 2, deficitFlagged: true,
    extraRooms: [{ type: "Art", count: 1, capacity: 25 }, { type: "Music", count: 1, capacity: 25 }, { type: "Cafeteria", count: 1, capacity: 130 }],
  },
  {
    dbn: "06M143", name: "IS 143 Eleanor Roosevelt", boro: "M", district: 6, type: "MS",
    lat: 40.8446, lng: -73.9376, buildingId: "M067",
    bands: [{ band: "4-8", avgClassSize: 22, numClasses: 20 }],
    buildingCapacity: 900, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 2, capacity: 28 }, { type: "Gym", count: 2, capacity: 40 }, { type: "Cafeteria", count: 1, capacity: 200 }],
  },
  {
    dbn: "02M300", name: "Beacon High School", boro: "M", district: 2, type: "HS",
    lat: 40.7712, lng: -73.9871, buildingId: "M090",
    bands: [{ band: "9-12", avgClassSize: 28, numClasses: 34 }],
    buildingCapacity: 1150, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: true,
    extraRooms: [{ type: "Art", count: 2, capacity: 26 }, { type: "Science Lab", count: 3, capacity: 28 }, { type: "Cafeteria", count: 1, capacity: 250 }, { type: "Gym", count: 1, capacity: 50 }],
  },
  {
    dbn: "13K008", name: "PS 8 Robert Fulton", boro: "K", district: 13, type: "ES",
    lat: 40.6976, lng: -73.9903, buildingId: "K012",
    bands: [{ band: "K-3", avgClassSize: 27, numClasses: 15 }, { band: "4-8", avgClassSize: 28, numClasses: 9 }],
    buildingCapacity: 680, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: true,
    extraRooms: [{ type: "Art", count: 1, capacity: 24 }, { type: "Cafeteria", count: 1, capacity: 110 }],
  },
  {
    dbn: "15K321", name: "PS 321 William Penn", boro: "K", district: 15, type: "ES",
    lat: 40.6710, lng: -73.9825, buildingId: "K045",
    bands: [{ band: "K-3", avgClassSize: 19, numClasses: 20 }, { band: "4-8", avgClassSize: 22, numClasses: 12 }],
    buildingCapacity: 1100, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 2, capacity: 28 }, { type: "Music", count: 1, capacity: 28 }, { type: "Gym", count: 2, capacity: 45 }, { type: "Cafeteria", count: 1, capacity: 220 }, { type: "Library", count: 1, capacity: 32 }],
  },
  {
    dbn: "15K051", name: "MS 51 William Alexander", boro: "K", district: 15, type: "MS",
    lat: 40.6788, lng: -73.9942, buildingId: "K058",
    bands: [{ band: "4-8", avgClassSize: 24, numClasses: 22 }],
    buildingCapacity: 950, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 1, capacity: 27 }, { type: "Gym", count: 1, capacity: 42 }, { type: "Cafeteria", count: 1, capacity: 180 }],
  },
  {
    dbn: "13K430", name: "Brooklyn Technical High School", boro: "K", district: 13, type: "HS",
    lat: 40.6896, lng: -73.9764, buildingId: "K090",
    bands: [{ band: "9-12", avgClassSize: 30, numClasses: 165 }],
    buildingCapacity: 4900, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: true,
    extraRooms: [{ type: "Science Lab", count: 6, capacity: 30 }, { type: "Art", count: 3, capacity: 28 }, { type: "Cafeteria", count: 2, capacity: 400 }, { type: "Gym", count: 2, capacity: 60 }],
  },
  {
    dbn: "30Q122", name: "PS 122 Mamie Fay", boro: "Q", district: 30, type: "ES",
    lat: 40.7674, lng: -73.9209, buildingId: "Q010",
    bands: [{ band: "K-3", avgClassSize: 25, numClasses: 18 }, { band: "4-8", avgClassSize: 26, numClasses: 11 }],
    buildingCapacity: 900, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: true,
    extraRooms: [{ type: "Art", count: 1, capacity: 26 }, { type: "Cafeteria", count: 1, capacity: 150 }],
  },
  {
    dbn: "30Q166", name: "PS 166 Henry Gradstein", boro: "Q", district: 30, type: "ES",
    lat: 40.7729, lng: -73.9235, buildingId: "Q015",
    bands: [{ band: "K-3", avgClassSize: 20, numClasses: 14 }, { band: "4-8", avgClassSize: 21, numClasses: 8 }],
    buildingCapacity: 620, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 1, capacity: 25 }, { type: "Gym", count: 1, capacity: 38 }, { type: "Cafeteria", count: 1, capacity: 100 }],
  },
  {
    dbn: "25Q125", name: "IS 125 Thom J. McCann Woodside", boro: "Q", district: 25, type: "MS",
    lat: 40.7614, lng: -73.8288, buildingId: "Q040",
    bands: [{ band: "4-8", avgClassSize: 23, numClasses: 24 }],
    buildingCapacity: 1020, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 1, capacity: 27 }, { type: "Gym", count: 1, capacity: 44 }, { type: "Cafeteria", count: 1, capacity: 190 }],
  },
  {
    dbn: "25Q400", name: "Francis Lewis High School", boro: "Q", district: 25, type: "HS",
    lat: 40.7602, lng: -73.7864, buildingId: "Q080",
    bands: [{ band: "9-12", avgClassSize: 33, numClasses: 145 }],
    buildingCapacity: 3400, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: true,
    extraRooms: [{ type: "Science Lab", count: 4, capacity: 30 }, { type: "Art", count: 2, capacity: 28 }, { type: "Cafeteria", count: 2, capacity: 350 }, { type: "Gym", count: 2, capacity: 55 }],
  },
  {
    dbn: "27Q105", name: "PS 105 The Bays Water", boro: "Q", district: 27, type: "ES",
    lat: 40.6602, lng: -73.7527, buildingId: "Q100",
    bands: [{ band: "K-3", avgClassSize: 22, numClasses: 12 }, { band: "4-8", avgClassSize: 23, numClasses: 7 }],
    buildingCapacity: 540, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 1, capacity: 24 }, { type: "Cafeteria", count: 1, capacity: 100 }],
  },
  {
    dbn: "10X152", name: "PS 152 Evergreen", boro: "X", district: 10, type: "ES",
    lat: 40.8778, lng: -73.8999, buildingId: "X020",
    bands: [{ band: "K-3", avgClassSize: 20, numClasses: 15 }, { band: "4-8", avgClassSize: 22, numClasses: 9 }],
    buildingCapacity: 700, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 1, capacity: 26 }, { type: "Gym", count: 1, capacity: 40 }, { type: "Cafeteria", count: 1, capacity: 130 }],
  },
  {
    dbn: "10X141", name: "MS 141 The Riverdale School", boro: "X", district: 10, type: "MS",
    lat: 40.8825, lng: -73.9038, buildingId: "X030",
    bands: [{ band: "4-8", avgClassSize: 29, numClasses: 18 }],
    buildingCapacity: 780, coLocated: true, numSchoolsInBuilding: 2, deficitFlagged: true,
    extraRooms: [{ type: "Art", count: 1, capacity: 25 }, { type: "Cafeteria", count: 1, capacity: 140 }],
  },
  {
    dbn: "10X445", name: "Bronx High School of Science", boro: "X", district: 10, type: "HS",
    lat: 40.8783, lng: -73.8907, buildingId: "X050",
    bands: [{ band: "9-12", avgClassSize: 31, numClasses: 105 }],
    buildingCapacity: 3000, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: true,
    extraRooms: [{ type: "Science Lab", count: 5, capacity: 30 }, { type: "Art", count: 2, capacity: 27 }, { type: "Cafeteria", count: 1, capacity: 320 }, { type: "Gym", count: 2, capacity: 55 }],
  },
  {
    dbn: "08X048", name: "PS 48 Joseph R. Drake", boro: "X", district: 8, type: "ES",
    lat: 40.8267, lng: -73.8412, buildingId: "X070",
    bands: [{ band: "K-3", avgClassSize: 23, numClasses: 13 }, { band: "4-8", avgClassSize: 24, numClasses: 8 }],
    buildingCapacity: 610, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 1, capacity: 25 }, { type: "Cafeteria", count: 1, capacity: 110 }],
  },
  {
    dbn: "31R022", name: "PS 22 Graniteville", boro: "R", district: 31, type: "ES",
    lat: 40.5834, lng: -74.1496, buildingId: "R010",
    bands: [{ band: "K-3", avgClassSize: 18, numClasses: 16 }, { band: "4-8", avgClassSize: 20, numClasses: 10 }],
    buildingCapacity: 800, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Art", count: 1, capacity: 26 }, { type: "Music", count: 1, capacity: 26 }, { type: "Gym", count: 1, capacity: 42 }, { type: "Cafeteria", count: 1, capacity: 160 }],
  },
  {
    dbn: "31R080", name: "Tottenville High School", boro: "R", district: 31, type: "HS",
    lat: 40.5087, lng: -74.2335, buildingId: "R040",
    bands: [{ band: "9-12", avgClassSize: 26, numClasses: 95 }],
    buildingCapacity: 2600, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: false,
    extraRooms: [{ type: "Science Lab", count: 3, capacity: 28 }, { type: "Art", count: 2, capacity: 26 }, { type: "Cafeteria", count: 1, capacity: 280 }, { type: "Gym", count: 2, capacity: 50 }],
  },
  {
    dbn: "20K130", name: "PS 130 Parkville", boro: "K", district: 20, type: "K8",
    lat: 40.6289, lng: -73.9754, buildingId: "K130",
    bands: [{ band: "K-3", avgClassSize: 28, numClasses: 14 }, { band: "4-8", avgClassSize: 27, numClasses: 12 }],
    buildingCapacity: 900, coLocated: false, numSchoolsInBuilding: 1, deficitFlagged: true,
    extraRooms: [{ type: "Art", count: 1, capacity: 26 }, { type: "Cafeteria", count: 1, capacity: 150 }],
  },
];

// ---- school_locations.csv ----
// Enrollment is derived from the mock bands (avgClassSize * numClasses), same
// arithmetic real class-size headcount would produce -- excluding "9-12"
// since real HS data counts course sections, not students, and we want the
// mock data to exercise the same "not real headcount" UI path.
const locHeader = "DBN,School Name,Borough,District,School Type,Latitude,Longitude,Building ID,Enrollment";
const locRows = schools.map((s) => {
  const enrollment = s.bands
    .filter((b) => b.band !== "9-12")
    .reduce((sum, b) => sum + Math.round(b.avgClassSize * b.numClasses), 0);
  return `${s.dbn},"${s.name}",${BORO_NAME[s.boro]},${s.district},${s.type},${s.lat},${s.lng},${s.buildingId},${enrollment || ""}`;
});
writeFileSync(join(RAW_DIR, "school_locations.csv"), [locHeader, ...locRows].join("\n") + "\n");

// ---- class_size.csv ----
const csHeader = "DBN,Grade Band,Number Of Classes,Number Of Students,Average Class Size,Target Cap";
const csRows: string[] = [];
for (const s of schools) {
  for (const b of s.bands) {
    const numStudents = b.avgClassSize * b.numClasses;
    csRows.push(`${s.dbn},${b.band},${b.numClasses},${numStudents},${b.avgClassSize},${CAPS[b.band]}`);
  }
}
writeFileSync(join(RAW_DIR, "class_size.csv"), [csHeader, ...csRows].join("\n") + "\n");

// ---- building_utilization.csv ----
const buHeader = "Building ID,Capacity,Enrollment,Co-Located,Num Schools In Building";
const buRows = schools.map((s) => {
  const enrollment = s.bands.reduce((sum, b) => sum + b.avgClassSize * b.numClasses, 0);
  return `${s.buildingId},${s.buildingCapacity},${enrollment},${s.coLocated ? "Y" : "N"},${s.numSchoolsInBuilding}`;
});
writeFileSync(join(RAW_DIR, "building_utilization.csv"), [buHeader, ...buRows].join("\n") + "\n");

// ---- space_deficit_schools.csv ----
const sdHeader = "DBN,Confirmed Space Deficit";
const sdRows = schools.filter((s) => s.deficitFlagged).map((s) => `${s.dbn},Y`);
writeFileSync(join(RAW_DIR, "space_deficit_schools.csv"), [sdHeader, ...sdRows].join("\n") + "\n");

// ---- room_inventory.csv ----
// Square footage is derived, not hand-authored, from a per-room-type model so
// it stays internally consistent with each room's stated seat capacity:
//   sqft = base (fixed footprint: walls, storage, circulation) + capacity * perPupil
// perPupil defaults to the DOE/building-code minimum of 20 sqft/pupil (35 for
// kindergarten) -- see the room-splitting feature for the citation.
const ROOM_SQFT_MODEL: Record<string, { base: number; perPupil: number }> = {
  Homeroom: { base: 150, perPupil: 20 },
  Art: { base: 250, perPupil: 20 },
  Music: { base: 200, perPupil: 20 },
  "Science Lab": { base: 250, perPupil: 22 },
  Library: { base: 900, perPupil: 10 },
  Cafeteria: { base: 400, perPupil: 12 },
  Gym: { base: 4000, perPupil: 5 },
};

function estimateRoomSqft(roomType: string, capacity: number): number {
  const model = ROOM_SQFT_MODEL[roomType] ?? { base: 300, perPupil: 20 };
  return Math.round(model.base + capacity * model.perPupil);
}

const riHeader = "Building ID,Room Type,Room Count,Typical Capacity,Square Footage";
const riRows: string[] = [];
for (const s of schools) {
  const totalHomerooms = s.bands.reduce((sum, b) => sum + b.numClasses, 0);
  const avgCap = Math.round(
    s.bands.reduce((sum, b) => sum + b.avgClassSize * b.numClasses, 0) /
      Math.max(1, totalHomerooms)
  );
  const homeroomCap = avgCap + 2;
  riRows.push(
    `${s.buildingId},Homeroom,${totalHomerooms},${homeroomCap},${estimateRoomSqft("Homeroom", homeroomCap)}`
  );
  for (const r of s.extraRooms) {
    riRows.push(`${s.buildingId},${r.type},${r.count},${r.capacity},${estimateRoomSqft(r.type, r.capacity)}`);
  }
}
writeFileSync(join(RAW_DIR, "room_inventory.csv"), [riHeader, ...riRows].join("\n") + "\n");

// ---- nearby_parcels.csv ----
// Mimics NYC PLUTO (property/land use) data: illustrative nearby lots for the
// "candidate site for a second building" feature. A handful per district,
// mixing city-owned and private ownership and a range of lot sizes/zoning.
interface ParcelDef {
  id: string;
  description: string;
  district: number;
  lat: number;
  lng: number;
  lotSqft: number;
  zoning: string;
  ownership: "City-owned" | "Private";
}

const parcels: ParcelDef[] = [
  { id: "P-M001", description: "Former annex lot, E 4th St", district: 1, lat: 40.7245, lng: -73.9808, lotSqft: 9500, zoning: "R7A", ownership: "City-owned" },
  { id: "P-M002", description: "Surface parking lot, Ave B", district: 3, lat: 40.7838, lng: -73.9741, lotSqft: 14200, zoning: "R8", ownership: "Private" },
  { id: "P-M003", description: "Vacant DCAS lot, W 96th St", district: 3, lat: 40.7912, lng: -73.9689, lotSqft: 7800, zoning: "R7B", ownership: "City-owned" },
  { id: "P-K001", description: "Underused warehouse lot, Bergen St", district: 13, lat: 40.6851, lng: -73.9798, lotSqft: 18500, zoning: "M1-1", ownership: "Private" },
  { id: "P-K002", description: "City-owned lot, Dean St", district: 15, lat: 40.6802, lng: -73.9781, lotSqft: 11000, zoning: "R6", ownership: "City-owned" },
  { id: "P-K003", description: "Vacant lot, Coney Island Ave", district: 20, lat: 40.6312, lng: -73.9711, lotSqft: 8200, zoning: "R5", ownership: "Private" },
  { id: "P-Q001", description: "Former factory site, Northern Blvd", district: 30, lat: 40.7651, lng: -73.9251, lotSqft: 16000, zoning: "M1-2", ownership: "Private" },
  { id: "P-Q002", description: "City-owned lot, 41st Ave", district: 30, lat: 40.7708, lng: -73.9192, lotSqft: 9900, zoning: "R6A", ownership: "City-owned" },
  { id: "P-Q003", description: "DCAS surplus site, Francis Lewis Blvd", district: 25, lat: 40.7580, lng: -73.7901, lotSqft: 21000, zoning: "R4", ownership: "City-owned" },
  { id: "P-X001", description: "Vacant lot, Broadway", district: 10, lat: 40.8801, lng: -73.9067, lotSqft: 10500, zoning: "R7-1", ownership: "Private" },
  { id: "P-X002", description: "City-owned lot, White Plains Rd", district: 8, lat: 40.8291, lng: -73.8479, lotSqft: 7600, zoning: "R6", ownership: "City-owned" },
  { id: "P-R001", description: "Surface lot, Richmond Ave", district: 31, lat: 40.5872, lng: -74.1522, lotSqft: 13400, zoning: "R3X", ownership: "Private" },
];

const parcelHeader = "Parcel ID,Description,District,Latitude,Longitude,Lot Area Sqft,Zoning,Ownership";
const parcelRows = parcels.map(
  (p) =>
    `${p.id},"${p.description}",${p.district},${p.lat},${p.lng},${p.lotSqft},${p.zoning},${p.ownership}`
);
writeFileSync(join(RAW_DIR, "nearby_parcels.csv"), [parcelHeader, ...parcelRows].join("\n") + "\n");

console.log(`Generated mock CSVs for ${schools.length} schools and ${parcels.length} parcels in ${RAW_DIR}`);
