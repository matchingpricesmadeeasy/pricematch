import { NextRequest, NextResponse } from "next/server";
import { getPriceHistory } from "../../../../lib/history";

export async function GET(req: NextRequest, { params }: { params: Promise<{ canonicalId: string }> }) {
  try {
    const { canonicalId } = await params;
    const days = Number(new URL(req.url).searchParams.get("days") || 90);
    const history = await getPriceHistory(decodeURIComponent(canonicalId), Number.isFinite(days) ? days : 90);
    if (!history) return NextResponse.json({ error: "Product history not found." }, { status: 404 });
    return NextResponse.json(history, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to load price history right now." }, { status: 500 });
  }
}
