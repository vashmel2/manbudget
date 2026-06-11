"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Wallet, PiggyBank, LineChart, Settings, Lock, Plus, ArrowUpFromLine } from "lucide-react";
import { Wordmark } from "./logo";
import { logout } from "@/app/login/actions";

const PRIMARY = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/income",    label: "Income",    Icon: ArrowUpFromLine },
  { href: "/bills",     label: "Bills",     Icon: Receipt },
  { href: "/budgets",   label: "Budgets",   Icon: Wallet },
  { href: "/savings",   label: "Savings",   Icon: PiggyBank },
  { href: "/history",   label: "History",   Icon: LineChart },
];

const MOBILE = [
  { href: "/dashboard", label: "Home",    Icon: Home },
  { href: "/bills",     label: "Bills",   Icon: Receipt },
  { href: "/transactions/new", label: "Add", Icon: Plus, big: true },
  { href: "/budgets",   label: "Budgets", Icon: Wallet },
  { href: "/history",   label: "History", Icon: LineChart },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="app-sidebar">
      <div style={{ padding: "0 6px 6px" }}>
        <Wordmark />
      </div>
      <Link href="/transactions/new" className="btn btn-primary" style={{ marginBottom: 6 }}>
        <Plus size={16} strokeWidth={2.5} />
        Add transaction
      </Link>
      <nav className="snav grow">
        {PRIMARY.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="item" data-on={isActive(pathname, href)}>
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="snav">
        <Link href="/settings" className="item" data-on={isActive(pathname, "/settings")}>
          <Settings size={16} />
          <span>Settings</span>
        </Link>
        <form action={logout}>
          <button type="submit" className="item" style={{ width: "100%", background: "transparent", border: "none", textAlign: "left" }}>
            <Lock size={16} />
            <span>Lock</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bnav">
      {MOBILE.map(({ href, label, Icon, big }) => (
        <Link key={href} href={href} className="item" data-on={isActive(pathname, href)}>
          {big ? (
            <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--pos)", color: "#06140d", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
              <Plus size={20} strokeWidth={2.5} />
            </span>
          ) : (
            <Icon size={20} />
          )}
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
