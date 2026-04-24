import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { useAuth } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ConfirmProvider } from "./context/ConfirmContext";

import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import ProfilePage from "./pages/auth/ProfilePage";

import DashboardPage from "./pages/nurse/DashboardPage";
import MyRosterPage from "./pages/nurse/MyRosterPage";
import WardRosterPage from "./pages/nurse/WardRosterPage";
import SwapPage from "./pages/nurse/SwapPage";
import TransferPage from "./pages/nurse/TransferPage";
import NotificationsPage from "./pages/nurse/NotificationsPage";
import NoticeBoardPage from "./pages/nurse/NoticeBoardPage";
import NewsPage from "./pages/nurse/NewsPage";
import DrugsPage from "./pages/nurse/DrugsPage";
import EquipmentPage from "./pages/nurse/EquipmentPage";
import OpportunitiesPage from "./pages/nurse/OpportunitiesPage";
import CommunityPage from "./pages/nurse/CommunityPage";
import DocumentsPage from "./pages/nurse/DocumentsPage";
import LeavePage from "./pages/nurse/LeavePage";
import OvertimePage from "./pages/nurse/OvertimePage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import PendingVerificationsPage from "./pages/admin/PendingVerificationsPage";
import RosterManagementPage from "./pages/admin/RosterManagementPage";
import LeaveManagementPage from "./pages/admin/LeaveManagementPage";
import OvertimeManagementPage from "./pages/admin/OvertimeManagementPage";
import NoticeManagementPage from "./pages/admin/NoticeManagementPage";
import NewsManagementPage from "./pages/admin/NewsManagementPage";
import DrugsManagementPage from "./pages/admin/DrugsManagementPage";
import EquipmentManagementPage from "./pages/admin/EquipmentManagementPage";
import OpportunitiesManagementPage from "./pages/admin/OpportunitiesManagementPage";
import DocumentsManagementPage from "./pages/admin/DocumentsManagementPage";
import CommunityManagementPage from "./pages/admin/CommunityManagementPage";
import UsersManagementPage from "./pages/admin/UsersManagementPage";
import WardManagementPage from "./pages/admin/WardManagementPage";

const AppLayout = ({ children }) => (
  <ConfirmProvider>
    <NotificationProvider>
      <SidebarProvider>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <TopBar />
            <div className="page-container">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  </ConfirmProvider>
);

const N = (role, El) => (
  <ProtectedRoute role={role}>
    <AppLayout>
      <El />
    </AppLayout>
  </ProtectedRoute>
);

function App() {
  const { user } = useAuth();
  return (
    <BrowserRouter>
      <Toaster
        toastOptions={{
          style: {
            background: "#0f1e3d",
            color: "#e2e8f0",
            border: "1px solid #1f3d77",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          },
        }}
      />
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={N(null, ProfilePage)} />

        {/* Nurse */}
        <Route path="/dashboard" element={N("nurse", DashboardPage)} />
        <Route path="/my-roster" element={N("nurse", MyRosterPage)} />
        <Route path="/ward-roster" element={N("nurse", WardRosterPage)} />
        <Route path="/swap" element={N("nurse", SwapPage)} />
        <Route path="/transfer" element={N("nurse", TransferPage)} />
        <Route path="/leave" element={N("nurse", LeavePage)} />
        <Route path="/overtime" element={N("nurse", OvertimePage)} />
        <Route path="/notices" element={N("nurse", NoticeBoardPage)} />
        <Route path="/news" element={N("nurse", NewsPage)} />
        <Route path="/drugs" element={N("nurse", DrugsPage)} />
        <Route path="/equipment" element={N("nurse", EquipmentPage)} />
        <Route path="/opportunities" element={N("nurse", OpportunitiesPage)} />
        <Route path="/community" element={N("nurse", CommunityPage)} />
        <Route path="/documents" element={N("nurse", DocumentsPage)} />
        <Route path="/notifications" element={N(null, NotificationsPage)} />

        {/* Admin */}
        <Route path="/admin" element={N("admin", AdminDashboardPage)} />
        <Route path="/admin/users" element={N("admin", UsersManagementPage)} />
        <Route
          path="/admin/verify"
          element={N("admin", PendingVerificationsPage)}
        />
        <Route
          path="/admin/roster"
          element={N("admin", RosterManagementPage)}
        />
        <Route path="/admin/leave" element={N("admin", LeaveManagementPage)} />
        <Route
          path="/admin/overtime"
          element={N("admin", OvertimeManagementPage)}
        />
        <Route
          path="/admin/notices"
          element={N("admin", NoticeManagementPage)}
        />
        <Route path="/admin/news" element={N("admin", NewsManagementPage)} />
        <Route path="/admin/drugs" element={N("admin", DrugsManagementPage)} />
        <Route
          path="/admin/equipment"
          element={N("admin", EquipmentManagementPage)}
        />
        <Route
          path="/admin/opportunities"
          element={N("admin", OpportunitiesManagementPage)}
        />
        <Route
          path="/admin/documents"
          element={N("admin", DocumentsManagementPage)}
        />
        <Route
          path="/admin/community"
          element={N("admin", CommunityManagementPage)}
        />
        <Route path="/admin/wards" element={N("admin", WardManagementPage)} />

        <Route
          path="/"
          element={
            <Navigate
              to={
                user
                  ? user.role === "admin"
                    ? "/admin"
                    : "/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
