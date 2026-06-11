"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Receipt, Wallet, PiggyBank, LineChart, Settings, Lock, Plus, ArrowUpFromLine, List, MoreHorizontal, ChevronRight, X } from "lucide-react";
import { Wordmark } from "./logo";
import { logout } from "@/app/login/actions";

const PRIMARY = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/income",    label: "Income",    Icon: ArrowUpFromLine },
  { href: "/bills",     label: "Bills",     Icon: Receipt },
  { href: "/budgets",   label: "Budgets",   Icon: Wallet },
  { href: "/savings",   label: "Savings",   Icon: PiggyBank },
  { href: "/transactions", label: "Transactions", Icon: List },
  { href: "/history",   label: "History",   Icon: LineChart },
];

const MOBILE_PRIMARY = [
  { href: "/dashboard", label: "Home",    Icon: Home },
  { href: "/bills",     label: "Bills",   Icon: Receipt },
];

const MOBILE_MORE = [
  { href: "/income",       label: "Income",       Icon: ArrowUpFromLine, sub: "Salary + gigs" },
  { href: "/transactions", label: "Transactions", Icon: List,            sub: "All your money in / out" },
  { href: "/budgets",      label: "Budgets",      Icon: Wallet,          sub: "Per-category caps" },
  { href: "/savings",      label: "Savings",      Icon: PiggyBank,       sub: "Goal + contributions" },
  { href: "/history",      label: "History",      Icon: LineChart,       sub: "Month-over-month" },
  { href: "/settings",     label: "Settings",     Icon: Settings,        sub: "Categories, members, export" },
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
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="bnav">
        {MOBILE_PRIMARY.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="item" data-on={isActive(pathname, href)}>
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
        <Link href="/transactions/new" className="item" data-on={isActive(pathname, "/transactions/new")}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: "var(--pos)", color: "#06140d", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
            <Plus size={22} strokeWidth={2.5} />
          </span>
          <span>Add</span>
        </Link>
        <Link href="/budgets" className="item" data-on={isActive(pathname, "/budgets")}>
          <Wallet size={22} />
          <span>Budgets</span>
        </Link>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="item"
          data-on={moreOpen || MOBILE_MORE.some((m) => isActive(pathname, m.href))}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
        >
          <MoreHorizontal size={22} />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="sheet-scrim" onClick={() => setMoreOpen(false)} />
          <div className="sheet">
            <div className="grab" />
            <div className="row-sb" style={{ padding: "4px 4px 12px" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>More</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="btn btn-ghost"
                style={{ height: 36, width: 36, padding: 0 }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="card" style={{ marginBottom: 12 }}>
              {MOBILE_MORE.map(({ href, label, Icon, sub }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className="lrow"
                  data-on={isActive(pathname, href)}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="icn"><Icon size={18} /></div>
                  <div className="col grow" style={{ minWidth: 0 }}>
                    <div className="nm">{label}</div>
                    <div className="sub">{sub}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
                </Link>
              ))}
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="btn btn-ghost btn-block"
                onClick={() => setMoreOpen(false)}
              >
                <Lock size={14} /> Lock app
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
