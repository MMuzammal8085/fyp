import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { isHr } from "../utils/auth";
import { formatDate } from "../utils/interview";

type Task = {
  _id?: any;
  assignedTo?: string;
  createdBy?: string;
  title?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  notes?: string;
  completedAt?: string;
  createdAt?: string;
};

type Employee = {
  _id?: any;
  username?: string;
  email?: string;
};

const taskStatuses = [
  "assigned",
  "pending",
  "testing",
  "completed",
  "submitted",
];

export default function TaskManager() {
  const isHrUser = isHr();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("assigned");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [taskRes, employeeRes] = await Promise.all([
        axiosInstance.get<Task[]>("/tasks"),
        isHrUser
          ? axiosInstance.get<Employee[]>("/employees")
          : Promise.resolve({ data: [] }),
      ]);
      setTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
      setEmployees(Array.isArray(employeeRes.data) ? employeeRes.data : []);
      if (isHrUser && !assignedTo && employeeRes.data?.[0]?._id) {
        setAssignedTo(String(employeeRes.data[0]._id));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const employeeNameById = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        String(employee._id),
        employee.username || employee.email || "Employee",
      ]),
    );
  }, [employees]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      await axiosInstance.post("/tasks", {
        title,
        description,
        assignedTo,
        status,
        dueDate,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      await loadData();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (taskId?: any, nextStatus?: string) => {
    if (!taskId || !nextStatus) return;
    try {
      await axiosInstance.patch(
        `/tasks/${encodeURIComponent(String(taskId))}/status`,
        {
          status: nextStatus,
        },
      );
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update task status");
    }
  };

  return (
    <div className="space-y-5">
      {isHrUser ? (
        <div className="app-panel p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create Task</h2>
          <p className="mt-1 text-sm text-slate-500">
            HR can assign tasks to employees and track progress.
          </p>

          {saveError ? (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
              {saveError}
            </div>
          ) : null}

          <form
            onSubmit={createTask}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            />
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            >
              <option value="">Assign to employee</option>
              {employees.map((employee) => (
                <option key={String(employee._id)} value={String(employee._id)}>
                  {employee.username || employee.email}
                </option>
              ))}
            </select>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              className="md:col-span-2 min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            >
              {taskStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
            />
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-white disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Plus size={16} />
                )}
                Create Task
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="app-panel p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Task List</h3>
          <button
            onClick={() => void loadData()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600 py-8">
            <Loader2 className="animate-spin" size={18} />
            Loading tasks...
          </div>
        ) : error ? (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-8 text-sm text-slate-500">No tasks available.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {tasks.map((task) => (
              <div
                key={String(task._id)}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Assigned to:{" "}
                      {employeeNameById.get(String(task.assignedTo)) ||
                        task.assignedTo}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      {task.description}
                    </p>
                  </div>
                  <div className="min-w-40">
                    <p className="text-xs uppercase text-slate-500 mb-2">
                      Status
                    </p>
                    {isHrUser ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 capitalize">
                        {task.status}
                      </span>
                    ) : (
                      <select
                        value={task.status || "assigned"}
                        onChange={(e) =>
                          void updateTaskStatus(task._id, e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        {taskStatuses.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-500 grid gap-2 md:grid-cols-2">
                  <div>Due date: {task.dueDate || "-"}</div>
                  <div>Created: {formatDate(task.createdAt)}</div>
                  <div>
                    Completed:{" "}
                    {task.completedAt ? formatDate(task.completedAt) : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
