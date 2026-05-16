import React from 'react';
import { Typography, Row, Col, Card, Statistic } from 'antd';
import { Trophy, GitBranch, Layers, Users } from 'lucide-react';
import { useAppContext } from './AppContext';

const { Title } = Typography;

const Dashboard = () => {
  const { hackathons, tracks, rounds } = useAppContext();

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Row gutter={[24, 24]}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Hackathons" 
              value={hackathons.length} 
              prefix={<Trophy size={20} style={{ marginRight: 8, color: '#1677ff' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tracks" 
              value={tracks.length} 
              prefix={<GitBranch size={20} style={{ marginRight: 8, color: '#52c41a' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Rounds" 
              value={rounds.length} 
              prefix={<Layers size={20} style={{ marginRight: 8, color: '#faad14' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Participants" 
              value={1240} 
              prefix={<Users size={20} style={{ marginRight: 8, color: '#eb2f96' }} />} 
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Quick Overview" style={{ marginTop: 24 }}>
        <p>Welcome to the SEAL Hackathon Management System.</p>
        <p>This system allows you to configure hackathons, manage tracks, and setup competition rounds.</p>
      </Card>
    </div>
  );
};

export default Dashboard;
