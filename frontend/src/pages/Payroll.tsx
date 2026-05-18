import { Navigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import PayrollManager from "../components/PayrollManager";

export default function Payroll() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <AppShell>
      <section className="space-y-7">
        <div className="rounded-3xl bg-linear-to-br from-rose-900 via-pink-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-rose-100/80">
            Compensation
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            Payroll Management
          </h1>
          <p className="mt-3 text-rose-50/90 max-w-3xl text-lg">
            Create and manage compensation records with automatic net-pay
            calculations. Maintain accurate payroll cycles aligned with
            attendance data.
          </p>
        </div>

        <PayrollManager />
      </section>
    </AppShell>
  );
}
