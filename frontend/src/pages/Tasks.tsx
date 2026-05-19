import { Navigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import TaskManager from "../components/TaskManager";
import { isEmployee } from "../utils/auth";

export default function Tasks() {
  const token = localStorage.getItem("token");
  const employeeView = isEmployee();

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <AppShell>
      <section className="space-y-7">
        <div className="rounded-3xl bg-linear-to-br from-green-900 via-emerald-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-green-100/80">
            {employeeView ? "My workspace" : "Operations"}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            {employeeView ? "My tasks" : "Task management"}
          </h1>
          <p className="mt-3 text-green-50/90 max-w-3xl text-lg">
            {employeeView
              ? "View tasks assigned to you and update your progress."
              : "Assign, track, and update tasks across your team."}
          </p>
        </div>

        <TaskManager />
      </section>
    </AppShell>
  );
}
