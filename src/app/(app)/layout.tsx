import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SideNav, BottomNav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  return (
    <div className="app-shell">
      <SideNav />
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
