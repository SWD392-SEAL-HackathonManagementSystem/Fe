import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../shared/components/layout/MainLayout';
import { ROUTES } from '../shared/constants/routes';

// Pages
import Dashboard from './Dashboard';
import HackathonListPage from '../features/hackathons/pages/HackathonListPage';
import CreateHackathonPage from '../features/hackathons/pages/CreateHackathonPage';
import HackathonSetupPage from '../features/hackathons/pages/HackathonSetupPage';
import TrackManagementPage from '../features/tracks/pages/TrackManagementPage';
import RoundManagementPage from '../features/rounds/pages/RoundManagementPage';
import { useParams } from 'react-router-dom';

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

const AppRouter = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.HACKATHONS} element={<HackathonListPage />} />
        <Route path={ROUTES.HACKATHON_CREATE} element={<CreateHackathonPage />} />
        <Route path={ROUTES.HACKATHON_SETUP} element={<HackathonSetupPage />} />
        
        {/* Explicit routes for tracks and rounds */}
        <Route path={ROUTES.TRACKS} element={<TrackWrapper />} />
        <Route path={ROUTES.ROUNDS} element={<RoundWrapper />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

export default AppRouter;
