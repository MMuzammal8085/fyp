import {
  Briefcase,
  CalendarCheck2,
  LayoutDashboard,
  ReceiptText,
  SquareCheckBig,
  Users,
  FileText,
  LogOut,
  Home,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    navigate("/signin", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-left transition ${
      isActive
        ? "bg-linear-to-r from-cyan-700 to-teal-700 text-white shadow-md shadow-cyan-500/20"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-cyan-50 to-white">
      <div className="mx-auto lg:flex">
        <aside className="w-full lg:w-80 lg:min-h-screen border-r border-slate-200 bg-white/90 backdrop-blur-sm p-6 lg:p-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-100 to-teal-100 px-3 py-1.5 mb-3">
              <div className="w-2 h-2 rounded-full bg-cyan-700"></div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-900">
                HR Workspace
              </p>
            </div>
            <Link
              to="/"
              className="inline-block text-3xl font-bold bg-linear-to-r from-cyan-800 to-teal-800 bg-clip-text text-transparent hover:opacity-90 transition"
              title="Go to Home"
            >
              IntelliHire
            </Link>
            <p className="text-sm text-slate-600 mt-2">
              Manage your HR operations
            </p>
          </div>

          <nav className="space-y-1.5">
            <NavLink
              to="/"
              className={({ isActive }) => `${linkClass({ isActive })} mb-4`}
              end
            >
              <Home size={18} />
              <span>Back to Home</span>
            </NavLink>

            <div className="pt-2 pb-1 px-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Modules
              </p>
            </div>

            <NavLink to="/dashboard" className={linkClass} end>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <NavLink to="/employees" className={linkClass}>
              <Users size={18} />
              Employees
            </NavLink>

            <NavLink to="/attendance" className={linkClass}>
              <CalendarCheck2 size={18} />
              Attendance
            </NavLink>

            <NavLink to="/tasks" className={linkClass}>
              <SquareCheckBig size={18} />
              Tasks
            </NavLink>

            <NavLink to="/payroll" className={linkClass}>
              <ReceiptText size={18} />
              Payroll
            </NavLink>

            <NavLink to="/interviews" className={linkClass}>
              <Briefcase size={18} />
              Interviews
            </NavLink>

            <NavLink to="/job-description" className={linkClass}>
              <FileText size={18} />
              Job Description
            </NavLink>
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={onLogout}
              className="w-full rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 px-3.5 text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-7 lg:p-10 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
