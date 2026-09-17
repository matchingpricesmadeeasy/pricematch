import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_METRICS_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days") || 7), 1), 90);
  const since = new Date(Date.now() - days * 86400000);
  const [events, users, clicks, watches, notifications] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.dealClick.count({ where: { createdAt: { gte: since } } }),
    db.watchlistItem.count({ where: { createdAt: { gte: since }, active: true } }),
    db.notificationLog.count({ where: { createdAt: { gte: since } } }),
  ]);
  return NextResponse.json({ days, since, users, clicks, activeWatches: watches, notifications, events: Object.fromEntries(events.map(e => [e.name, e._count._all])) });
}
