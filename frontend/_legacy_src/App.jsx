import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewInspectionPage from './pages/NewInspectionPage';
import InspectionEditorPage from './pages/InspectionEditorPage';
import InspectionReviewPage from './pages/InspectionReviewPage';
import InspectionDetailPage from './pages/InspectionDetailPage';
import ReturnedInspectionPage from './pages/ReturnedInspectionPage';
import InspectionReturnedPage from './pages/InspectionReturnedPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import DirectorReviewPage from './pages/DirectorReviewPage';
import FinalReviewPage from './pages/FinalReviewPage';
import CEOReviewPage from './pages/CEOReviewPage';
import OutletListPage from './pages/OutletListPage';
import OutletDetailPage from './pages/OutletDetailPage';
import OutletFormPage from './pages/OutletFormPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';
import EmailLogsPage from './pages/EmailLogsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'DIRECTOR', 'CEO_REGISTRAR', 'SYSTEM_ADMIN']}>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/inspections/new" element={
              <ProtectedRoute allowedRoles={['INSPECTOR']}>
                <NewInspectionPage />
              </ProtectedRoute>
            } />
            <Route path="/inspections/:id/edit" element={
              <ProtectedRoute allowedRoles={['INSPECTOR']}>
                <InspectionEditorPage />
              </ProtectedRoute>
            } />
            <Route path="/inspections/:id/review" element={
              <ProtectedRoute allowedRoles={['INSPECTOR']}>
                <InspectionReviewPage />
              </ProtectedRoute>
            } />
            <Route path="/inspections/:id" element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'DIRECTOR', 'CEO_REGISTRAR', 'SYSTEM_ADMIN']}>
                <InspectionDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/inspections/:id/returned" element={
              <ProtectedRoute allowedRoles={['INSPECTOR']}>
                <ReturnedInspectionPage />
              </ProtectedRoute>
            } />
            <Route path="/inspections/returned" element={
              <ProtectedRoute allowedRoles={['INSPECTOR']}>
                <InspectionReturnedPage />
              </ProtectedRoute>
            } />

            <Route path="/review" element={
              <ProtectedRoute allowedRoles={['DIRECTOR']}>
                <ReviewQueuePage />
              </ProtectedRoute>
            } />
            <Route path="/review/:id" element={
              <ProtectedRoute allowedRoles={['DIRECTOR']}>
                <DirectorReviewPage />
              </ProtectedRoute>
            } />
            <Route path="/final-review" element={
              <ProtectedRoute allowedRoles={['CEO_REGISTRAR']}>
                <FinalReviewPage />
              </ProtectedRoute>
            } />
            <Route path="/final-review/:id" element={
              <ProtectedRoute allowedRoles={['CEO_REGISTRAR']}>
                <CEOReviewPage />
              </ProtectedRoute>
            } />

            <Route path="/outlets" element={
              <ProtectedRoute>
                <OutletListPage />
              </ProtectedRoute>
            } />
            <Route path="/outlets/new" element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'SYSTEM_ADMIN']}>
                <OutletFormPage />
              </ProtectedRoute>
            } />
            <Route path="/outlets/:id/edit" element={
              <ProtectedRoute allowedRoles={['INSPECTOR', 'SYSTEM_ADMIN']}>
                <OutletFormPage />
              </ProtectedRoute>
            } />
            <Route path="/outlets/:id" element={
              <ProtectedRoute>
                <OutletDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/audit-logs" element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AuditLogsPage />
              </ProtectedRoute>
            } />
            <Route path="/email-logs" element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <EmailLogsPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
