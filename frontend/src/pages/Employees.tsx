import { Navigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmployeeManager from "../components/EmployeeManager";

export default function Employees() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <AppShell>
      <section className="space-y-7">
        <div className="rounded-3xl bg-linear-to-br from-purple-900 via-violet-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-purple-100/80">
            People
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            Manage Your Team
          </h1>
          <p className="mt-3 text-purple-50/90 max-w-3xl text-lg">
            Create new employee accounts, manage their details, and maintain
            accurate records for your growing organization.
          </p>
        </div>

        <EmployeeManager />
      </section>
    </AppShell>
  );
}
