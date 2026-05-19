import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { isEmployee } from "../utils/auth";
import EmployeeDashboard from "./EmployeeDashboard";
import {
  Briefcase,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  SquareCheckBig,
  TrendingUp,
  Users,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import AppShell from "../components/AppShell";
import StatCard from "../components/StatCard";

type InterviewItem = { _id?: string; totalInvitesSent?: number };
type TaskItem = { status?: string; title?: string; dueDate?: string };
type AttendanceItem = { date?: string; status?: string };
type EmployeeItem = { _id?: string };

const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export default function Dashboard() {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const [intRes, taskRes, attRes, empRes] = await Promise.allSettled([
          axiosInstance.get<InterviewItem[]>("/interviews"),
          axiosInstance.get<TaskItem[]>("/tasks"),
          axiosInstance.get<AttendanceItem[]>("/attendance"),
          axiosInstance.get<EmployeeItem[]>("/employees"),
        ]);

        setInterviews(
          intRes.status === "fulfilled" && Array.isArray(intRes.value.data)
            ? intRes.value.data
            : [],
        );
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
        setEmployees(
          empRes.status === "fulfilled" && Array.isArray(empRes.value.data)
            ? empRes.value.data
            : [],
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  if (isEmployee()) {
    return (
      <AppShell>
        <EmployeeDashboard />
      </AppShell>
    );
  }

  const totalInterviews = interviews.length;
  const invitesSent = interviews.reduce(
    (sum, i) => sum + (i.totalInvitesSent ?? 0),
    0,
  );
  const pendingTasks = tasks.filter(
    (t) => String(t.status ?? "").toLowerCase() !== "completed",
  );
  const todayAttendance = attendance.filter((a) => isToday(a.date));
  const presentToday = todayAttendance.filter(
    (a) => String(a.status ?? "").toLowerCase() === "present",
  ).length;

  const chartHeights = [42, 58, 65, 48, 72, 38, 55];

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="rounded-3xl bg-linear-to-br from-cyan-900 via-teal-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/80">
                Executive Analytics
              </p>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold">
                Dashboard Overview
              </h1>
              <p className="mt-3 text-cyan-50/90 max-w-2xl text-lg">
                Live snapshot of hiring, workforce attendance, and operational
                tasks.
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Interview roles"
            value={loading ? "…" : String(totalInterviews)}
            icon={<Briefcase size={18} />}
          />
          <StatCard
            label="Invites sent"
            value={loading ? "…" : String(invitesSent)}
            icon={<Clock3 size={18} />}
          />
          <StatCard
            label="Present today"
            value={loading ? "…" : `${presentToday}/${todayAttendance.length || 0}`}
            icon={<CalendarCheck2 size={18} />}
          />
          <StatCard
            label="Pending tasks"
            value={loading ? "…" : String(pendingTasks.length)}
            icon={<SquareCheckBig size={18} />}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="app-panel lg:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="app-panel-title">Weekly activity</h2>
                <p className="app-panel-muted">
                  Interviews, attendance marks, and task updates
                </p>
              </div>
              <TrendingUp className="text-cyan-600" size={22} />
            </div>
            <div className="chart-bar">
              {chartHeights.map((h, i) => (
                <span key={weekLabels[i]} style={{ height: `${h}%` }} title={weekLabels[i]} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
              {weekLabels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>

          <div className="app-panel">
            <h2 className="app-panel-title">Today&apos;s attendance</h2>
            <p className="app-panel-muted mb-4">
              {presentToday} marked present of {todayAttendance.length} records
            </p>
            {todayAttendance.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No attendance logged yet today.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayAttendance.slice(0, 5).map((a, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-sm app-record py-2 px-3"
                  >
                    <span className="capitalize">{a.status ?? "present"}</span>
                    <CheckCircle2
                      size={16}
                      className={
                        String(a.status).toLowerCase() === "present"
                          ? "text-teal-500"
                          : "text-[var(--text-muted)]"
                      }
                    />
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

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="app-panel">
            <h2 className="app-panel-title">Pending tasks</h2>
            <p className="app-panel-muted mb-4">
              {pendingTasks.length} items need attention
            </p>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                All caught up — no pending tasks.
              </p>
            ) : (
              <ul className="space-y-2">
                {pendingTasks.slice(0, 6).map((task, idx) => (
                  <li key={idx} className="app-record flex justify-between gap-2 text-sm">
                    <span className="font-medium text-[var(--text)]">
                      {task.title ?? "Untitled task"}
                    </span>
                    <span className="app-badge">{task.status ?? "open"}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/tasks"
              className="mt-4 inline-block text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400"
            >
              View all tasks →
            </Link>
          </div>

          <div className="app-panel">
            <h2 className="app-panel-title">Workforce snapshot</h2>
            <p className="app-panel-muted mb-4">
              {employees.length} employees in directory
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="app-record text-center py-4">
                <Users className="mx-auto text-cyan-600 mb-2" size={22} />
                <strong className="text-2xl text-[var(--text)]">
                  {loading ? "…" : employees.length}
                </strong>
                <p className="text-xs text-[var(--text-muted)] mt-1">Employees</p>
              </div>
              <div className="app-record text-center py-4">
                <ClipboardList className="mx-auto text-teal-600 mb-2" size={22} />
                <strong className="text-2xl text-[var(--text)]">
                  {loading ? "…" : invitesSent}
                </strong>
                <p className="text-xs text-[var(--text-muted)] mt-1">Invites</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/job-description"
            className="app-panel block transition hover:border-cyan-500/50 hover:shadow-lg"
          >
            <Briefcase className="text-cyan-600" size={22} />
            <h3 className="mt-3 font-bold text-[var(--text)]">Job & Parsing</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Manage descriptions and resume scoring.
            </p>
          </Link>
          <Link
            to="/interviews"
            className="app-panel block transition hover:border-cyan-500/50 hover:shadow-lg"
          >
            <Clock3 className="text-teal-600" size={22} />
            <h3 className="mt-3 font-bold text-[var(--text)]">Interview Hub</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Track calls, invites, and live status.
            </p>
          </Link>
          <Link
            to="/interviews"
            className="app-panel block transition hover:border-cyan-500/50 hover:shadow-lg"
          >
            <ClipboardList className="text-indigo-500" size={22} />
            <h3 className="mt-3 font-bold text-[var(--text)]">Evaluation Desk</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Summaries, sentiment, and transcripts.
            </p>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
