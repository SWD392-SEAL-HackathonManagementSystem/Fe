import React from 'react';
import { Routes, Route, Navigate, Outlet, useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../shared/components/layout/MainLayout';
import { ROUTES } from '../shared/constants/routes';

// Pages
import Dashboard from './Dashboard';
import HackathonListPage from '../features/hackathons/pages/HackathonListPage';
import CreateHackathonPage from '../features/hackathons/pages/CreateHackathonPage';
import HackathonSetupPage from '../features/hackathons/pages/HackathonSetupPage';
import TrackManagementPage from '../features/tracks/pages/TrackManagementPage';
import RoundManagementPage from '../features/rounds/pages/RoundManagementPage';
import CriteriaManagementPage from '../features/criteria/pages/CriteriaManagementPage';
import ReviewValidatePage from '../features/review/pages/ReviewValidatePage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import OnboardingPage from '../features/auth/pages/OnboardingPage';
import ChangePasswordPage from '../features/auth/pages/ChangePasswordPage';
import UserApprovalPage from '../features/auth/pages/UserApprovalPage';
import TempJudgesPage from '../features/auth/pages/TempJudgesPage';
import CoordinatorTeamPage from '../features/coordinator-teams/pages/CoordinatorTeamPage';
import GithubCallbackPage from '../features/auth/pages/GithubCallbackPage';

const TrackWrapper = () => {
  const { hackathonId } = useParams();
  return (
    <div style={{ padding: 24 }}>
      <TrackManagementPage hackathonId={parseInt(hackathonId)} />
    </div>
  );
};

const RoundWrapper = () => {
  const { hackathonId } = useParams();
  return (
    <div style={{ padding: 24 }}>
      <RoundManagementPage hackathonId={parseInt(hackathonId)} />
    </div>
  );
};

const CriteriaWrapper = () => {
  const { hackathonId, roundId } = useParams();
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <CriteriaManagementPage
        roundId={parseInt(roundId)}
        roundName={`Round #${roundId} Criteria`}
        onBack={() => navigate(`/hackathons/${hackathonId}/setup`)}
      />
    </div>
  );
};

const ReviewWrapper = () => {
  return (
    <div style={{ padding: 24 }}>
      <ReviewValidatePage />
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    // Check must change password (for guest judges)
    if (userInfo.mustChangePassword) {
      return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
    }

    if (userInfo.status === 'REJECTED') {
      localStorage.clear();
      return <Navigate to={ROUTES.LOGIN} state={{ rejected: true }} replace />;
    }

    // Check allowed roles
    if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  } catch (e) {
    // no-op
  }

  return children;
};

const MainLayoutWrapper = () => (
  <ProtectedRoute>
    <MainLayout>
      <Outlet />
    </MainLayout>
  </ProtectedRoute>
);

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.GITHUB_CALLBACK} element={<GithubCallbackPage />} />
      <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePasswordPage />} />

      {/* Protected Routes inside MainLayout */}
      <Route element={<MainLayoutWrapper />}>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
        <Route path={ROUTES.PROFILE} element={<OnboardingPage />} />
        <Route path={ROUTES.HACKATHONS} element={<HackathonListPage />} />
        <Route path={ROUTES.HACKATHON_CREATE} element={<CreateHackathonPage />} />
        <Route path={ROUTES.HACKATHON_SETUP} element={<HackathonSetupPage />} />
        <Route path={ROUTES.GLOBAL_TEAMS} element={<CoordinatorTeamPage />} />
        <Route path={ROUTES.USER_APPROVAL} element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMIN']}>
            <UserApprovalPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.TEMP_JUDGES} element={
          <ProtectedRoute allowedRoles={['COORDINATOR', 'ADMIN']}>
            <TempJudgesPage />
          </ProtectedRoute>
        } />
        
        {/* Explicit routes for tracks and rounds */}
        <Route path={ROUTES.TRACKS} element={<TrackWrapper />} />
        <Route path={ROUTES.ROUNDS} element={<RoundWrapper />} />
        <Route path={ROUTES.CRITERIA} element={<CriteriaWrapper />} />
        <Route path={ROUTES.REVIEW_VALIDATE} element={<ReviewWrapper />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
