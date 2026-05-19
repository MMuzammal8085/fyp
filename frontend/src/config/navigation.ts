import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CalendarCheck2,
  FileText,
  LayoutDashboard,
  ReceiptText,
  SquareCheckBig,
  Users,
} from "lucide-react";
import { UserRole, getUserRole } from "../utils/auth";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const hrNavSections: NavSection[] = [
  {
    title: "Analytics",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    title: "Hiring",
    items: [
      { to: "/job-description", label: "Job & Parsing", icon: FileText },
      { to: "/interviews", label: "Interview Hub", icon: Briefcase },
    ],
  },
  {
    title: "Operations",
    items: [
      { to: "/employees", label: "Employees", icon: Users },
      { to: "/attendance", label: "Attendance", icon: CalendarCheck2 },
      { to: "/tasks", label: "Tasks", icon: SquareCheckBig },
      { to: "/payroll", label: "Payroll", icon: ReceiptText },
    ],
  },
];

const employeeNavSections: NavSection[] = [
  {
    title: "My workspace",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      { to: "/attendance", label: "My attendance", icon: CalendarCheck2 },
      { to: "/tasks", label: "My tasks", icon: SquareCheckBig },
    ],
  },
];

export function getNavSectionsForRole(role: number | null): NavSection[] {
  if (role === UserRole.HR) return hrNavSections;
  if (role === UserRole.EMPLOYEE) return employeeNavSections;
  return employeeNavSections;
}

export function getNavSections(): NavSection[] {
  return getNavSectionsForRole(getUserRole());
}
