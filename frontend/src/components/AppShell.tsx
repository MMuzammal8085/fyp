import { useEffect, useState } from "react";
import { Home, LogOut, Menu } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { getNavSections } from "../config/navigation";
import { clearAuthStorage, getUserRole } from "../utils/auth";
import BrandLogo from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";

type AppShellProps = {
  children: React.ReactNode;
};

const SIDEBAR_KEY = "intellihire-sidebar-collapsed";

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const role = getUserRole();
  const navSections = getNavSections();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === "true",
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const onLogout = () => {
    clearAuthStorage();
    navigate("/signin", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition ${
      collapsed ? "justify-center px-2" : "px-3.5"
    } ${
      isActive
        ? "bg-linear-to-r from-cyan-700 to-teal-700 text-white shadow-md shadow-cyan-500/25"
        : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
    }`;

  const sidebarWidth = collapsed ? "w-[4.25rem]" : "w-72";
  const mainMargin = collapsed ? "max-lg:ml-[4.25rem]" : "max-lg:ml-72";

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors">
      {isMobile && !collapsed && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setCollapsed(true)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`app-sidebar ${sidebarWidth} ${
            isMobile ? "fixed inset-y-0 left-0 z-40" : "sticky top-0 z-30"
          } flex h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 ease-in-out`}
        >
          <div
            className={`flex items-center border-b border-[var(--border)] p-3 ${
              collapsed ? "flex-col gap-2 py-4" : "gap-2"
            }`}
          >
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="sidebar-menu-btn"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand menu" : "Collapse menu"}
            >
              <Menu size={22} />
            </button>

            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <BrandLogo size="lg" />
                </div>
                <ThemeToggle />
              </>
            )}
          </div>

          {collapsed && (
            <div className="flex flex-col items-center gap-2 border-b border-[var(--border)] py-3">
              <BrandLogo size="sm" to={undefined} />
              <ThemeToggle />
            </div>
          )}

          <nav className="sidebar-nav flex-1 px-2 py-4 space-y-1">
            <NavLink to="/" className={linkClass} end title="Back to Home">
              <Home size={20} />
              {!collapsed && <span>Back to Home</span>}
            </NavLink>

            {navSections.map((section) => (
              <div key={section.title} className="pt-3">
                {!collapsed && (
                  <p className="px-3.5 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={linkClass}
                      title={item.label}
                    >
                      <Icon size={20} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-[var(--border)] p-3">
            {!collapsed && role !== null && (
              <p className="mb-2 px-1 text-[0.65rem] text-[var(--text-muted)]">
                {role === 1 ? "HR account" : role === 2 ? "Employee account" : "Account"}
              </p>
            )}
            <button
              type="button"
              onClick={onLogout}
              className={`w-full rounded-lg border border-red-200/80 bg-red-50 py-2.5 text-sm font-medium text-red-700 transition flex items-center justify-center gap-2 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70 ${
                collapsed ? "px-2" : "px-3.5"
              }`}
              title="Logout"
            >
              <LogOut size={18} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <main
          className={`min-h-screen min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 md:p-7 lg:p-10 text-[var(--text)] transition-[margin] duration-300 ${mainMargin} lg:ml-0`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
