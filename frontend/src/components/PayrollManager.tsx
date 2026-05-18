import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { getUserRole } from "../utils/auth";
import { formatDate } from "../utils/interview";

type Payroll = {
  _id?: any;
  employeeId?: string;
  employeeName?: string;
  month?: string;
  baseSalary?: number;
  allowance?: number;
  deductions?: number;
  netPay?: number;
  status?: string;
  note?: string;
  paidAt?: string;
  createdAt?: string;
};

type Employee = {
  _id?: any;
  username?: string;
  email?: string;
};

const payrollStatuses = ["draft", "reviewed", "approved", "paid"];

export default function PayrollManager() {
  const role = getUserRole();
  const canManage = role === 1;

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [allowance, setAllowance] = useState("");
  const [deductions, setDeductions] = useState("");
  const [status, setStatus] = useState("draft");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    if (!canManage) return;
    setLoading(true);
    setError("");
    try {
      const [payrollRes, employeeRes] = await Promise.all([
        axiosInstance.get<Payroll[]>("/payroll"),
        axiosInstance.get<Employee[]>("/employees"),
      ]);
      const payrollRows = Array.isArray(payrollRes.data) ? payrollRes.data : [];
      setPayrolls(payrollRows);
      setEmployees(Array.isArray(employeeRes.data) ? employeeRes.data : []);
      if (!selectedId && payrollRows[0]?._id) {
        fillForm(payrollRows[0]);
      }
      if (!employeeId && employeeRes.data?.[0]?._id) {
        setEmployeeId(String(employeeRes.data[0]._id));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  const fillForm = (payroll: Payroll) => {
    setSelectedId(String(payroll._id || ""));
    setEmployeeId(payroll.employeeId || "");
    setMonth(payroll.month || "");
    setBaseSalary(String(payroll.baseSalary ?? 0));
    setAllowance(String(payroll.allowance ?? 0));
    setDeductions(String(payroll.deductions ?? 0));
    setStatus(payroll.status || "draft");
    setNote(payroll.note || "");
    setPaidAt(payroll.paidAt || "");
  };

  const resetForm = () => {
    setSelectedId("");
    setEmployeeId(employees[0]?._id ? String(employees[0]._id) : "");
    setMonth("");
    setBaseSalary("");
    setAllowance("");
    setDeductions("");
    setStatus("draft");
    setNote("");
    setPaidAt("");
  };

  const netPay = useMemo(() => {
    return (
      Number(baseSalary || 0) + Number(allowance || 0) - Number(deductions || 0)
    );
  }, [baseSalary, allowance, deductions]);

  const submitPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const payload = {
        employeeId,
        month,
        baseSalary: Number(baseSalary || 0),
        allowance: Number(allowance || 0),
        deductions: Number(deductions || 0),
        status,
        note,
        paidAt,
      };

      if (selectedId) {
        await axiosInstance.patch(
          `/payroll/${encodeURIComponent(selectedId)}`,
          payload,
        );
      } else {
        await axiosInstance.post("/payroll", payload);
      }
      resetForm();
      await loadData();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || "Failed to save payroll");
    } finally {
      setSaving(false);
    }
  };

  const removePayroll = async (id?: any) => {
    if (!id) return;
    try {
      await axiosInstance.delete(`/payroll/${encodeURIComponent(String(id))}`);
      if (String(id) === selectedId) {
        resetForm();
      }
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete payroll");
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Payroll</h2>
        <p className="mt-2 text-sm text-slate-600">
          Payroll records are managed by HR.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Payroll Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create, edit, and delete payroll records for employees.
            </p>
          </div>
          {selectedId ? (
            <button
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              New Payroll
            </button>
          ) : null}
        </div>

        {saveError ? (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {saveError}
          </div>
        ) : null}

        <form
          onSubmit={submitPayroll}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={String(employee._id)} value={String(employee._id)}>
                {employee.username || employee.email}
              </option>
            ))}
          </select>
          <input
            type="month"
            required
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />
          <input
            type="number"
            required
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            placeholder="Base salary"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />
          <input
            type="number"
            value={allowance}
            onChange={(e) => setAllowance(e.target.value)}
            placeholder="Allowance"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />
          <input
            type="number"
            value={deductions}
            onChange={(e) => setDeductions(e.target.value)}
            placeholder="Deductions"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          >
            {payrollStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Payroll note"
            className="md:col-span-2 min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
          />

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div>
              <p className="text-sm text-slate-500">Calculated Net Pay</p>
              <p className="text-2xl font-semibold text-slate-900">{netPay}</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-white disabled:opacity-70"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : selectedId ? (
                <Pencil size={16} />
              ) : (
                <Plus size={16} />
              )}
              {selectedId ? "Update Payroll" : "Create Payroll"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Payroll Records
          </h3>
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
            Loading payroll records...
          </div>
        ) : error ? (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        ) : payrolls.length === 0 ? (
          <p className="py-8 text-sm text-slate-500">No payroll records yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {payrolls.map((payroll) => (
              <div
                key={String(payroll._id)}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {payroll.employeeName}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Month: {payroll.month}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      Net pay: {payroll.netPay}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 capitalize">
                    {payroll.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => fillForm(payroll)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => removePayroll(payroll._id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2 text-sm text-slate-500">
                  <div>Created: {formatDate(payroll.createdAt)}</div>
                  <div>
                    Paid at: {payroll.paidAt ? formatDate(payroll.paidAt) : "-"}
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
