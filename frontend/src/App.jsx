import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import TakeAttendancePage from "./pages/TakeAttendancePage";
import AttendanceHistoryPage from "./pages/AttendanceHistoryPage";
import ReportsPage from "./pages/ReportsPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-ink-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ink-400 font-body">Loading ClassRoll…</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<DashboardPage />} />
          <Route path="students"     element={<StudentsPage />} />
          <Route path="attendance"   element={<TakeAttendancePage />} />
          <Route path="history"      element={<AttendanceHistoryPage />} />
          <Route path="reports"      element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
