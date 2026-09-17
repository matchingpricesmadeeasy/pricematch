import { db } from "./db";
import { currentUser } from "./auth";

export const EVENTS = ["search","result_view","deal_click","watchlist_add","watchlist_remove","alert_triggered"] as const;
export type AnalyticsEventName = typeof EVENTS[number];

export async function track(name: AnalyticsEventName, input: { userId?: string; productId?: string; retailerId?: string; sessionKey?: string; path?: string; metadata?: Record<string, unknown> } = {}) {
  return db.analyticsEvent.create({ data: { name, userId: input.userId, productId: input.productId, retailerId: input.retailerId, sessionKey: input.sessionKey, path: input.path, metadataJson: input.metadata ? JSON.stringify(input.metadata) : undefined } });
}

export async function trackForRequest(name: AnalyticsEventName, input: Omit<Parameters<typeof track>[1], "userId"> = {}) {
  const user = await currentUser();
  return track(name, { ...input, userId: user?.id });
}
