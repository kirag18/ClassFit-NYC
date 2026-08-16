import { NextResponse } from "next/server";
import { getSchoolDetail } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ dbn: string }> }) {
  try {
    const { dbn } = await params;
    const detail = getSchoolDetail(dbn.toUpperCase());
    if (!detail) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load school" }, { status: 500 });
  }
}
