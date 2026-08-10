import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications, staffUsers } from "@/db/schema";

export type NotificationDto = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function listNotificationsForStaff(
  staffUserId: string,
  limit = 20,
): Promise<NotificationDto[]> {
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      href: notifications.href,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.staffUserId, staffUserId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(staffUserId: string) {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.staffUserId, staffUserId),
        isNull(notifications.readAt),
      ),
    );
  return rows.length;
}

async function activeAdmins() {
  return db
    .select({ id: staffUsers.id })
    .from(staffUsers)
    .where(and(eq(staffUsers.role, "admin"), eq(staffUsers.active, true)));
}

async function staffForDriver(driverId: string) {
  const [row] = await db
    .select({ id: staffUsers.id })
    .from(staffUsers)
    .where(
      and(
        eq(staffUsers.driverId, driverId),
        eq(staffUsers.role, "driver"),
        eq(staffUsers.active, true),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function notifyAdmins(input: {
  type: string;
  title: string;
  body?: string;
  href?: string;
}) {
  const admins = await activeAdmins();
  if (!admins.length) return;
  await db.insert(notifications).values(
    admins.map((a) => ({
      staffUserId: a.id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
    })),
  );
}

export async function notifyDriver(input: {
  driverId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
}) {
  const staff = await staffForDriver(input.driverId);
  if (!staff) return;
  await db.insert(notifications).values({
    staffUserId: staff.id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
  });
}
