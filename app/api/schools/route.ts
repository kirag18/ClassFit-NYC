import { NextResponse } from "next/server";
import { listSchoolSummaries, listSourceYears } from "@/lib/queries";

export async function GET() {
  try {
    const schools = listSchoolSummaries();
    return NextResponse.json({ schools, sourceYears: listSourceYears() });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load schools. Have you run `npm run setup:data`?" },
      { status: 500 }
    );
  }
}
