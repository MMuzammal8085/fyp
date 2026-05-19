import { Navigate, Outlet } from "react-router-dom";
import { UserRole, getUserRole } from "../utils/auth";

/** HR + Employee workspace (not candidates). */
export function WorkspaceRoute() {
  const role = getUserRole();
  if (!localStorage.getItem("token")) {
    return <Navigate to="/signin" replace />;
  }
  if (role === UserRole.CANDIDATE) {
    return <Navigate to="/" replace />;
  }
  if (role === null) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}

/** HR-only routes (interviews, payroll, employees, etc.). */
export function HrRoute() {
  const role = getUserRole();
  if (role !== UserRole.HR) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
