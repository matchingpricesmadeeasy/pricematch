import { NextRequest, NextResponse } from "next/server";
import { track, EVENTS } from "../../../lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || "");
    if (!EVENTS.includes(name as never)) return NextResponse.json({ error: "Unsupported event." }, { status: 400 });
    const sessionKey = typeof body?.sessionKey === "string" ? body.sessionKey.slice(0, 128) : undefined;
    const path = typeof body?.path === "string" ? body.path.slice(0, 256) : undefined;
    const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : undefined;
    await track(name as typeof EVENTS[number], { sessionKey, path, metadata });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to record event." }, { status: 500 }); }
}
