import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { getUserRole } from "../utils/auth";
import { formatDate } from "../utils/interview";

type AttendanceRecord = {
  _id?: any;
  employeeName?: string;
  date?: string;
  status?: string;
  checkInAt?: string;
  checkOutAt?: string;
  note?: string;
  createdAt?: string;
};

export default function AttendancePanel() {
  const role = getUserRole();
  const canMark = role === 2;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");
  const [markSuccess, setMarkSuccess] = useState("");

  useEffect(() => {
    void loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get<AttendanceRecord[]>("/attendance");
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async () => {
    setMarkError("");
    setMarkSuccess("");
    setMarking(true);
    try {
      const res = await axiosInstance.post("/attendance/mark", {
        status: "present",
      });
      setMarkSuccess(res.data?.message || "Attendance marked successfully");
      await loadRecords();
    } catch (err: any) {
      setMarkError(err?.response?.data?.message || "Failed to mark attendance");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Attendance</h2>
            <p className="mt-1 text-sm text-slate-500">
              Employees can mark attendance; HR can review all attendance
              records.
            </p>
          </div>
          {canMark ? (
            <button
              onClick={markAttendance}
              disabled={marking}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-white disabled:opacity-70"
            >
              {marking ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Mark Today&apos;s Attendance
            </button>
          ) : null}
        </div>

        {markError ? (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {markError}
          </div>
        ) : null}
        {markSuccess ? (
          <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
            {markSuccess}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Attendance Records
          </h3>
          <button
            onClick={() => void loadRecords()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600 py-8">
            <Loader2 className="animate-spin" size={18} />
            Loading attendance...
          </div>
        ) : error ? (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        ) : records.length === 0 ? (
          <p className="py-8 text-sm text-slate-500">
            No attendance records yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {records.map((record) => (
              <div
                key={String(record._id)}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {record.employeeName}
                    </p>
                    <p className="text-sm text-slate-500">
                      Date: {record.date}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 capitalize">
                    {record.status || "present"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3 text-sm text-slate-600">
                  <div>
                    Check-in:{" "}
                    {record.checkInAt ? formatDate(record.checkInAt) : "-"}
                  </div>
                  <div>
                    Check-out:{" "}
                    {record.checkOutAt ? formatDate(record.checkOutAt) : "-"}
                  </div>
                  <div>Created: {formatDate(record.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
