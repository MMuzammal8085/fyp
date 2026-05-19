import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { UserRole, getUserRole, isEmployee } from "../utils/auth";
import { formatDate } from "../utils/interview";
import { Panel, PanelMuted, PanelTitle } from "./ui/Panel";

type AttendanceRecord = {
  _id?: string;
  employeeName?: string;
  date?: string;
  status?: string;
  checkInAt?: string;
  checkOutAt?: string;
  createdAt?: string;
};

export default function AttendancePanel() {
  const canMark = isEmployee();
  const isHrView = getUserRole() === UserRole.HR;

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
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load attendance";
      setError(message);
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
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to mark attendance";
      setMarkError(message);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <PanelTitle>Attendance</PanelTitle>
            <PanelMuted>
              {isHrView
                ? "Review attendance for all employees."
                : "Mark your daily attendance and view your history."}
            </PanelMuted>
          </div>
          {canMark ? (
            <button
              type="button"
              onClick={markAttendance}
              disabled={marking}
              className="app-btn-primary"
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

        {markError ? <div className="alert-error mt-4">{markError}</div> : null}
        {markSuccess ? (
          <div className="alert-success mt-4">{markSuccess}</div>
        ) : null}
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <PanelTitle>Attendance Records</PanelTitle>
          <button
            type="button"
            onClick={() => void loadRecords()}
            className="app-btn-secondary"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-[var(--text-muted)]">
            <Loader2 className="animate-spin" size={18} />
            Loading attendance...
          </div>
        ) : error ? (
          <div className="alert-error mt-4">{error}</div>
        ) : records.length === 0 ? (
          <p className="py-8 text-sm text-[var(--text-muted)]">
            No attendance records yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {records.map((record) => (
              <div key={String(record._id)} className="app-record">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--text)]">
                      {record.employeeName}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Date: {record.date}
                    </p>
                  </div>
                  <span className="app-badge">{record.status || "present"}</span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3 text-sm text-[var(--text-muted)]">
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
      </Panel>
    </div>
  );
}
