import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import Features from "./pages/Features";
import Project from "./pages/Project";
import ContactUs from "./pages/ContactUs";
import Pricing from "./pages/Pricing";
import Careers from "./pages/Careers";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";
import Payroll from "./pages/Payroll";
import Interviews from "./pages/Interviews";
import InterviewResults from "./pages/InterviewResults";
import CandidateResult from "./pages/CandidateResult";
import JobDescription from "./pages/JobDescription";
import InterviewJoin from "./pages/InterviewJoin";
import VapiInterview from "./pages/VapiInterview";
import { HrRoute, WorkspaceRoute } from "./components/RoleRoute";

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/signin" replace />;
}

function PublicOnlyRoute() {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/features" element={<Features />} />
        <Route path="/project" element={<Project />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
        </Route>

        <Route path="/interview/join" element={<InterviewJoin />} />
        <Route path="/interview/vapi" element={<VapiInterview />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<WorkspaceRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/tasks" element={<Tasks />} />
          </Route>

          <Route element={<HrRoute />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route
              path="/interviews/:id/results"
              element={<InterviewResults />}
            />
            <Route
              path="/interviews/results/email/:email"
              element={<CandidateResult />}
            />
            <Route path="/job-description" element={<JobDescription />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
