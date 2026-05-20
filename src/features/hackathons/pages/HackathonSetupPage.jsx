import React, { useState } from 'react';
import { Card, Tabs, Typography, Select, Space, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/ui/PageHeader';
import TrackManagementPage from '../../tracks/pages/TrackManagementPage';
import RoundManagementPage from '../../rounds/pages/RoundManagementPage';
import CriteriaManagementPage from '../../criteria/pages/CriteriaManagementPage';
import ReviewValidatePage from '../../criteria/pages/ReviewValidatePage';
import { ROUTES } from '../../../shared/constants/routes';
import PeopleManagementPage from '../../people/pages/PeopleManagementPage';
import EventManagementPage from '../../events/pages/EventManagementPage';
import { hackathonService } from '../services/hackathonService';
import { roundService } from '../../rounds/services/roundService';
import { mapHackathonToFE } from '../mappers/hackathonMapper';
import { mapRoundToFE } from '../../rounds/mappers/roundMapper';

const { Title } = Typography;
const { Option } = Select;

const HackathonSetupPage = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hackData, roundsData] = await Promise.all([
          hackathonService.getById(hackathonId),
          roundService.listByHackathon(hackathonId)
        ]);
        
        const fullRounds = await Promise.all(
          (roundsData || []).map(async (r) => {
            try {
              const detail = await roundService.getById(r.id);
              return mapRoundToFE(detail);
            } catch (e) {
              return mapRoundToFE(r);
            }
          })
        );
        
        setHackathon(mapHackathonToFE(hackData));
        setRounds(fullRounds);
      } catch (error) {
        // Fallback for not found or errors
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hackathonId]);

  if (loading) {
    return <Card style={{ textAlign: 'center', padding: '40px 0' }}>Đang tải...</Card>;
  }

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
          {rounds.length === 0 ? (
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
                    {rounds.map(r => (
                      <Option key={r.id} value={r.id}>
                        {r.name} {r.is_final || r.isFinal ? '(Chung kết)' : ''}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </div>
              {selectedRoundId ? (
                <CriteriaManagementPage
                  hackathonId={hackathon.id}
                  roundId={selectedRoundId}
                  roundName={rounds.find(r => r.id === selectedRoundId)?.name}
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
      children: <ReviewValidatePage hackathonId={hackathon.id} />,
    },
    {
      key: 'people',
      label: 'Nhân sự',
      children: <PeopleManagementPage hackathonId={hackathon.id} />,
    },
    {
      key: 'events',
      label: 'Lịch trình & Sự kiện',
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
