import { PanelShell } from "@/components/panel/panel-sidebar";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <PanelShell userName={session?.name} logoutAction={logoutAction}>
      {children}
    </PanelShell>
  );
}
