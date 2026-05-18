import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { getUserRole } from "../utils/auth";

type Employee = {
  _id?: any;
  username?: string;
  email?: string;
  role?: number;
  createdAt?: string;
};

export default function EmployeeManager() {
  const role = getUserRole();
  const canManage = role === 1;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    void loadEmployees();
  }, []);

  const loadEmployees = async () => {
    if (!canManage) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get<Employee[]>("/employees");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      await axiosInstance.post("/employees", {
        username,
        email,
        password,
      });
      setUsername("");
      setEmail("");
      setPassword("");
      await loadEmployees();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || "Failed to add employee");
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async (id?: any) => {
    if (!id) return;
    try {
      await axiosInstance.delete(
        `/employees/${encodeURIComponent(String(id))}`,
      );
      await loadEmployees();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to remove employee");
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Employees</h2>
        <p className="mt-2 text-sm text-slate-600">
          You can view employee related workflow here, but only HR can add or
          remove employees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add Employee</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create an employee account with the employee role.
        </p>

        {saveError ? (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {saveError}
          </div>
        ) : null}

        <form onSubmit={onCreate} className="mt-4 grid gap-4 md:grid-cols-3">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Employee name"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="employee@company.com"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary password"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />
          <div className="md:col-span-3 flex justify-end">
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
              Add Employee
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Employee List
          </h3>
          <button
            onClick={() => void loadEmployees()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600 py-8">
            <Loader2 className="animate-spin" size={18} />
            Loading employees...
          </div>
        ) : error ? (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        ) : employees.length === 0 ? (
          <p className="py-8 text-sm text-slate-500">No employees added yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {employees.map((employee) => (
              <div
                key={String(employee._id)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {employee.username}
                  </p>
                  <p className="text-sm text-slate-500">{employee.email}</p>
                </div>
                <button
                  onClick={() => onRemove(employee._id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
