import React, { useState } from 'react';
import { Card, Tabs, Typography } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/ui/PageHeader';
import TrackManagementPage from '../../tracks/pages/TrackManagementPage';
import RoundManagementPage from '../../rounds/pages/RoundManagementPage';
import { useAppContext } from '../../../app/AppContext';
import { ROUTES } from '../../../shared/constants/routes';
import PeopleManagementPage from '../../people/pages/PeopleManagementPage';
import EventManagementPage from '../../events/pages/EventManagementPage';

const { Title } = Typography;

const HackathonSetupPage = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { hackathons } = useAppContext();
  
  const hackathon = hackathons.find(h => h.id === parseInt(hackathonId));

  if (!hackathon) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px 0' }}>
        <Typography.Title level={4}>Không tìm thấy sự kiện</Typography.Title>
        <Button type="primary" onClick={() => navigate(ROUTES.HACKATHONS)}>
          Quay lại danh sách
        </Button>
      </Card>
    );
  }

  const items = [
    {
      key: 'tracks',
      label: 'Bảng đấu (Tracks)',
      children: <TrackManagementPage hackathonId={hackathon.id} />,
    },
    {
      key: 'rounds',
      label: 'Vòng thi (Rounds)',
      children: <RoundManagementPage hackathonId={hackathon.id} />,
    },
    {
      key: 'people',
      label: 'Nhân sự (People)',
      children: <PeopleManagementPage hackathonId={hackathon.id} />,
    },
    {
      key: 'events',
      label: 'Lịch trình (Events)',
      children: <EventManagementPage hackathonId={hackathon.id} />,
    },
  ];

  return (
    <div>
      <PageHeader 
        title={hackathon.name}
        subtitle={`Thiết lập bảng đấu và vòng thi cho mùa ${hackathon.season} ${hackathon.year}`}
        onBack={() => navigate(ROUTES.HACKATHONS)}
      />

      <Card style={{ borderRadius: 12 }}>
        <Tabs defaultActiveKey="tracks" items={items} />
      </Card>
    </div>
  );
};

export default HackathonSetupPage;
