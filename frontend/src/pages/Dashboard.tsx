import { Navigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <AppShell>
      <section className="space-y-7">
        <div className="rounded-3xl bg-linear-to-br from-cyan-900 via-teal-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/80">
                Executive
              </p>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold">
                Dashboard Overview
              </h1>
              <p className="mt-3 text-cyan-50/90 max-w-3xl text-lg">
                Monitor all HR operations from your centralized command center.
                Track recruitment, attendance, payroll, and team performance in
                real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <StatCard label="Interview Workspace" value="Operational" />
          <StatCard label="Employee Records" value="Active" />
          <StatCard label="System Status" value="Healthy" />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <p className="mt-2 text-sm text-slate-600 mb-4">
              Navigate to modules using the sidebar to manage interviews,
              employees, attendance, tasks, payroll, and more.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="inline-block px-3 py-1.5 bg-cyan-50 text-cyan-700 text-xs font-semibold rounded-full">
                Interviews
              </div>
              <div className="inline-block px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full">
                Employees
              </div>
              <div className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                Payroll
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Workflow Guide</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>✓ Create interview in Interviews module</li>
              <li>✓ Send invitations to candidates</li>
              <li>✓ Review results and shortlist</li>
              <li>✓ Onboard to Employees</li>
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
