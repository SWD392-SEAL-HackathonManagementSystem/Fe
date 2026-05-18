import React, { useState } from 'react';
import { Card, Tabs, Typography, Select, Space, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/ui/PageHeader';
import TrackManagementPage from '../../tracks/pages/TrackManagementPage';
import RoundManagementPage from '../../rounds/pages/RoundManagementPage';
import CriteriaManagementPage from '../../criteria/pages/CriteriaManagementPage';
import ReviewValidatePage from '../../criteria/pages/ReviewValidatePage';
import { useAppContext } from '../../../app/AppContext';
import { ROUTES } from '../../../shared/constants/routes';

const { Title } = Typography;
const { Option } = Select;

const HackathonSetupPage = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { hackathons, tracks, rounds } = useAppContext();
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  
  const hackathon = hackathons.find(h => h.id === parseInt(hackathonId));
  const hackathonTracks = tracks.filter(t => t.hackathon_id === parseInt(hackathonId));
  const trackIds = hackathonTracks.map(t => t.id);
  const hackathonRounds = rounds.filter(r => trackIds.includes(r.track_id));

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
      key: 'criteria',
      label: 'Criteria',
      children: (
        <div>
          {hackathonRounds.length === 0 ? (
            <Card>Please create at least one round before managing criteria.</Card>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <span style={{ fontWeight: 500 }}>Select Round:</span>
                  <Select
                    placeholder="Choose a round to manage criteria"
                    style={{ width: 300 }}
                    onChange={setSelectedRoundId}
                    value={selectedRoundId}
                  >
                    {hackathonRounds.map(r => {
                      const track = hackathonTracks.find(t => t.id === r.track_id);
                      return (
                        <Option key={r.id} value={r.id}>
                          {track?.name} → {r.name}
                        </Option>
                      );
                    })}
                  </Select>
                </Space>
              </div>
              {selectedRoundId ? (
                <CriteriaManagementPage
                  roundId={selectedRoundId}
                  roundName={hackathonRounds.find(r => r.id === selectedRoundId)?.name}
                  onBack={() => setSelectedRoundId(null)}
                />
              ) : (
                <Card style={{ textAlign: 'center', padding: '40px 0' }}>
                  Please select a round above to manage its scoring criteria.
                </Card>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: 'review',
      label: 'Review & Validate',
      children: <ReviewValidatePage />,
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
