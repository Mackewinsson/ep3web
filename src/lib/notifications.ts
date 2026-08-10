import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { drivers, notifications, staffUsers } from "@/db/schema";

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

/** Resolves the panel login for a driver; heals email↔driver_id if unlinked. */
export async function resolveDriverStaffUser(driverId: string) {
  const [byLink] = await db
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
  if (byLink) return byLink;

  const [driver] = await db
    .select({ email: drivers.email })
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);
  if (!driver?.email) return null;

  const [byEmail] = await db
    .select({ id: staffUsers.id, driverId: staffUsers.driverId })
    .from(staffUsers)
    .where(
      and(
        eq(staffUsers.email, driver.email.toLowerCase()),
        eq(staffUsers.role, "driver"),
        eq(staffUsers.active, true),
      ),
    )
    .limit(1);

  if (!byEmail) return null;

  // Heal orphan staff row so future lookups and session auth stay consistent
  if (byEmail.driverId !== driverId) {
    await db
      .update(staffUsers)
      .set({ driverId, updatedAt: new Date() })
      .where(eq(staffUsers.id, byEmail.id));
  }

  return { id: byEmail.id };
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

/** @returns true if a notification was created for the driver's panel user */
export async function notifyDriver(input: {
  driverId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
}): Promise<boolean> {
  const staff = await resolveDriverStaffUser(input.driverId);
  if (!staff) return false;
  await db.insert(notifications).values({
    staffUserId: staff.id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
  });
  return true;
}
