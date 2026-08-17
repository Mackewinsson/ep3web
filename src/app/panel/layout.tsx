import type { Metadata } from "next";
import { PanelShell } from "@/components/panel/panel-sidebar";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import {
  countUnreadNotifications,
  listNotificationsForStaff,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const notifications = session
    ? await listNotificationsForStaff(session.sub)
    : [];
  const unreadCount = session
    ? await countUnreadNotifications(session.sub)
    : 0;

  return (
    <PanelShell
      userName={session?.name}
      role={session?.role ?? "admin"}
      logoutAction={logoutAction}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </PanelShell>
  );
}
