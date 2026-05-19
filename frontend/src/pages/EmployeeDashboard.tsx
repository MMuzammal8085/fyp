import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  SquareCheckBig,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import StatCard from "../components/StatCard";

type TaskItem = {
  status?: string;
  title?: string;
  dueDate?: string;
};

type AttendanceItem = {
  date?: string;
  status?: string;
  checkInAt?: string;
};

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function EmployeeDashboard() {
  const username = localStorage.getItem("username") ?? "there";
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [taskRes, attRes] = await Promise.allSettled([
          axiosInstance.get<TaskItem[]>("/tasks"),
          axiosInstance.get<AttendanceItem[]>("/attendance"),
        ]);

        setTasks(
          taskRes.status === "fulfilled" && Array.isArray(taskRes.value.data)
            ? taskRes.value.data
            : [],
        );
        setAttendance(
          attRes.status === "fulfilled" && Array.isArray(attRes.value.data)
            ? attRes.value.data
            : [],
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (t) => String(t.status ?? "").toLowerCase() !== "completed",
      ),
    [tasks],
  );

  const todayRecord = attendance.find((a) => isToday(a.date));
  const markedToday =
    todayRecord &&
    String(todayRecord.status ?? "").toLowerCase() === "present";

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-linear-to-br from-teal-900 via-cyan-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/80">
              Employee portal
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold">
              Welcome, {username}
            </h1>
            <p className="mt-3 text-cyan-50/90 max-w-2xl text-lg">
              Your attendance history and assigned tasks — nothing else is shown
              here.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <p className="text-cyan-100/80 text-xs uppercase tracking-wider">
              Today
            </p>
            <p className="mt-1 font-semibold">{formatToday()}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending tasks"
          value={loading ? "…" : String(pendingTasks.length)}
          icon={<SquareCheckBig size={18} />}
        />
        <StatCard
          label="Today's attendance"
          value={
            loading
              ? "…"
              : markedToday
                ? "Present"
                : todayRecord
                  ? String(todayRecord.status ?? "—")
                  : "Not marked"
          }
          icon={<CalendarCheck2 size={18} />}
        />
        <StatCard
          label="Total records"
          value={loading ? "…" : String(attendance.length)}
          icon={<Clock3 size={18} />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="app-panel">
          <h2 className="app-panel-title">My pending tasks</h2>
          <p className="app-panel-muted mb-4">
            Tasks assigned to you by HR
          </p>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading…</p>
          ) : pendingTasks.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No pending tasks right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingTasks.slice(0, 8).map((task, idx) => (
                <li
                  key={idx}
                  className="app-record flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm"
                >
                  <span className="font-medium text-[var(--text)]">
                    {task.title ?? "Untitled"}
                  </span>
                  <span className="app-badge">{task.status ?? "assigned"}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/tasks"
            className="mt-4 inline-block text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400"
          >
            Manage my tasks →
          </Link>
        </div>

        <div className="app-panel">
          <h2 className="app-panel-title">My attendance</h2>
          <p className="app-panel-muted mb-4">
            Only your check-ins and history
          </p>
          {!markedToday && !loading && (
            <p className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              You have not marked attendance for today yet.
            </p>
          )}
          {markedToday && (
            <p className="mb-4 flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
              <CheckCircle2 size={18} />
              Marked present today
            </p>
          )}
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading…</p>
          ) : attendance.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No attendance records yet.
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto sidebar-nav">
              {attendance.slice(0, 10).map((row, idx) => (
                <li
                  key={idx}
                  className="app-record flex justify-between gap-2 text-sm"
                >
                  <span className="text-[var(--text)]">{row.date}</span>
                  <span className="app-badge capitalize">
                    {row.status ?? "present"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/attendance"
            className="mt-4 inline-block text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400"
          >
            Open attendance →
          </Link>
        </div>
      </div>
    </section>
  );
}
