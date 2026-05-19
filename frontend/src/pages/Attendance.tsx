import { Navigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import AttendancePanel from "../components/AttendancePanel";
import { isEmployee } from "../utils/auth";

export default function Attendance() {
  const token = localStorage.getItem("token");
  const employeeView = isEmployee();

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <AppShell>
      <section className="space-y-7">
        <div className="rounded-3xl bg-linear-to-br from-orange-900 via-amber-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-orange-100/80">
            {employeeView ? "My workspace" : "Workforce"}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            {employeeView ? "My attendance" : "Attendance tracking"}
          </h1>
          <p className="mt-3 text-orange-50/90 max-w-3xl text-lg">
            {employeeView
              ? "Mark your attendance for today and review your personal history."
              : "Review attendance records for all employees in real time."}
          </p>
        </div>

        <AttendancePanel />
      </section>
    </AppShell>
  );
}
