"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import {
  countUnreadNotifications,
  listNotificationsForStaff,
} from "@/lib/notifications";

export async function markNotificationRead(notificationId: string) {
  const session = await requireStaff();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.staffUserId, session.sub),
      ),
    );
  revalidatePath("/panel", "layout");
}

export async function markAllNotificationsRead() {
  const session = await requireStaff();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.staffUserId, session.sub),
        isNull(notifications.readAt),
      ),
    );
  revalidatePath("/panel", "layout");
}

export async function getPanelNotifications() {
  const session = await requireStaff();
  const items = await listNotificationsForStaff(session.sub);
  const unreadCount = await countUnreadNotifications(session.sub);
  return { items, unreadCount };
}
