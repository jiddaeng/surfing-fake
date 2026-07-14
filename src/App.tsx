import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/Layout'
import { useAuth } from './context/AuthContext'
import type { Role } from './types'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ClubsPage } from './pages/ClubsPage'
import { ClubDetailPage } from './pages/ClubDetailPage'
import { StudentDashboard } from './pages/StudentDashboard'
import { ApplyPage } from './pages/ApplyPage'
import { MyApplicationsPage } from './pages/MyApplicationsPage'
import { LeaderDashboard } from './pages/LeaderDashboard'
import { LeaderClubPage } from './pages/LeaderClubPage'
import { LeaderApplicantsPage } from './pages/LeaderApplicantsPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { NotFoundPage } from './pages/NotFoundPage'

function Shell() { return <AppLayout><Outlet /></AppLayout> }

function Protected({ roles }: { roles: Role[] }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-r-brand-600" /></div>
  if (!profile) return <Navigate to="/login" replace />
  if (!roles.includes(profile.role)) {
    const home = profile.role === 'student' ? '/dashboard' : profile.role === 'leader' ? '/leader' : '/admin'
    return <Navigate to={home} replace />
  }
  return <Outlet />
}

function HomeRedirect() {
  const { profile } = useAuth()
  if (!profile) return <ClubsPage />
  return <Navigate to={profile.role === 'student' ? '/dashboard' : profile.role === 'leader' ? '/leader' : '/admin'} replace />
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route element={<Shell />}>
      <Route index element={<HomeRedirect />} />
      <Route path="clubs" element={<ClubsPage />} />
      <Route path="clubs/:id" element={<ClubDetailPage />} />
      <Route element={<Protected roles={['student']} />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="clubs/:id/apply" element={<ApplyPage />} />
        <Route path="applications" element={<MyApplicationsPage />} />
      </Route>
      <Route element={<Protected roles={['leader']} />}>
        <Route path="leader" element={<LeaderDashboard />} />
        <Route path="leader/club" element={<LeaderClubPage />} />
        <Route path="leader/applicants" element={<LeaderApplicantsPage />} />
      </Route>
      <Route element={<Protected roles={['admin']} />}>
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
}
