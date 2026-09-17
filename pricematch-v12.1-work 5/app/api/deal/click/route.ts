import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { currentUser } from "../../../../lib/auth";
import { track } from "../../../../lib/analytics";

const allowedHosts = new Set([
  "amazon.com", "www.amazon.com", "walmart.com", "www.walmart.com",
  "bestbuy.com", "www.bestbuy.com", "target.com", "www.target.com",
  "homedepot.com", "www.homedepot.com",
]);

export async function POST(req: NextRequest) {
  try {
    const { offerId } = await req.json();
    if (!offerId) return NextResponse.json({ error: "offerId is required." }, { status: 400 });
    const offer = await db.offer.findUnique({ where: { id: String(offerId) }, include: { retailer: true } });
    if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
    const destination = new URL(offer.url);
    const host = destination.hostname.toLowerCase();
    if (destination.protocol !== "https:") return NextResponse.json({ error: "Retailer destination must use HTTPS." }, { status: 400 });
    if (!allowedHosts.has(host)) return NextResponse.json({ error: "Retailer destination is not allowed." }, { status: 400 });
    const user = await currentUser();
    await db.dealClick.create({ data: { offerId: offer.id, userId: user?.id, retailer: offer.retailer.name, destinationHost: host } });
    await track("deal_click", { userId: user?.id, productId: offer.productId, retailerId: offer.retailerId, metadata: { host } });
    return NextResponse.json({ url: offer.url });
  } catch {
    return NextResponse.json({ error: "Unable to record deal click." }, { status: 500 });
  }
}
