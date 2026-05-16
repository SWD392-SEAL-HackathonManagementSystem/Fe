import React, { useState } from 'react';
import { Card, Tabs, Typography } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/ui/PageHeader';
import TrackManagementPage from '../../tracks/pages/TrackManagementPage';
import RoundManagementPage from '../../rounds/pages/RoundManagementPage';
import { useAppContext } from '../../../app/AppContext';
import { ROUTES } from '../../../shared/constants/routes';

const { Title } = Typography;

const HackathonSetupPage = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { hackathons } = useAppContext();
  
  const hackathon = hackathons.find(h => h.id === parseInt(hackathonId));

  if (!hackathon) {
    return <div>Hackathon not found</div>;
  }

  const items = [
    {
      key: 'tracks',
      label: 'Tracks',
      children: <TrackManagementPage hackathonId={parseInt(hackathonId)} />,
    },
    {
      key: 'rounds',
      label: 'Rounds',
      children: <RoundManagementPage hackathonId={parseInt(hackathonId)} />,
    },
  ];

  return (
    <div>
      <PageHeader 
        title={hackathon.name}
        subtitle={`Configure tracks and rounds for ${hackathon.season} ${hackathon.year}`}
        backAction={() => navigate(ROUTES.HACKATHONS)}
      />

      <Tabs defaultActiveKey="tracks" items={items} type="card" />
    </div>
  );
};

export default HackathonSetupPage;
