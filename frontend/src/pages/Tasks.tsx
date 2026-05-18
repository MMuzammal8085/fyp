import { Navigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import TaskManager from "../components/TaskManager";

export default function Tasks() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <AppShell>
      <section className="space-y-7">
        <div className="rounded-3xl bg-linear-to-br from-green-900 via-emerald-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-green-100/80">
            Operations
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            Task Management
          </h1>
          <p className="mt-3 text-green-50/90 max-w-3xl text-lg">
            Assign, track, and update tasks across your team. Monitor progress
            and ensure deadlines are met with transparent workflow visibility.
          </p>
        </div>

        <TaskManager />
      </section>
    </AppShell>
  );
}
