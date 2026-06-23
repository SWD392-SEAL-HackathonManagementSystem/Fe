// src/features/judging/pages/LiveScoringPage.jsx
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Typography, Button, Spin, Layout, Space, Tag, Avatar } from 'antd';
import { 
  ArrowLeftOutlined, TrophyOutlined, AppstoreOutlined, CrownOutlined, UserOutlined, WifiOutlined 
} from '@ant-design/icons';
import { useLiveScoringV2 } from '../hooks/useLiveScoringV2';

import JudgeSidebarQueue from '../components/JudgeSidebarQueue';
import JudgeScoringWorkspace from '../components/JudgeScoringWorkspace';
import JudgeTimerAndControls from '../components/JudgeTimerAndControls';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

const LiveScoringPage = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const { roundId, trackId, isFinal, assignmentType } = useLocation().state || {};

  const scoringLogic = useLiveScoringV2(assignmentId, roundId, trackId, isFinal, assignmentType);

  if (scoringLogic.isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <Spin size="large" />
        <Text type="secondary" style={{ marginTop: 16, fontWeight: 500 }}>Đang thiết lập kết nối mã hóa vào phòng chấm thi...</Text>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f7fe' }}>
      
      <Header style={{ 
        background: '#ffffff', padding: '0 40px', display: 'flex', alignItems: 'center', 
        justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', height: 80,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Button 
            type="text" icon={<ArrowLeftOutlined style={{ fontSize: 18, color: '#475569' }} />} 
            onClick={() => navigate(-1)} 
            style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: 4 }}>
            <Space align="center" size="middle">
              <Title level={3} style={{ margin: 0, color: '#0f172a', fontWeight: 800, letterSpacing: 0.5 }}>
                Phòng Chấm Thi Trực Tiếp
              </Title>
              <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 800, margin: 0, border: 'none', background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', fontSize: 12 }}>
                <WifiOutlined style={{ marginRight: 6 }} /> LIVE SCORING
              </Tag>
            </Space>
            <Space size="middle" style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                {isFinal ? <><TrophyOutlined style={{color: '#f59e0b'}}/> Vòng Chung Kết</> : <><AppstoreOutlined style={{color: '#3b82f6'}}/> Vòng Sơ Loại</>}
              </Text>
              <Text type="secondary" style={{ fontSize: 14, color: '#cbd5e1' }}>|</Text>
              <Text type="secondary" style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>
                Mã phân công: <strong style={{color: '#334155'}}>#{assignmentId}</strong>
              </Text>
            </Space>
          </div>
        </div>

        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 16, background: scoringLogic.isController ? '#fffbeb' : '#eff6ff', 
          padding: '10px 20px', borderRadius: 16, border: `1px solid ${scoringLogic.isController ? '#fde68a' : '#bfdbfe'}` 
        }}>
          <Avatar 
            size={40} 
            style={{ background: scoringLogic.isController ? '#f59e0b' : '#3b82f6', boxShadow: scoringLogic.isController ? '0 4px 10px rgba(245, 158, 11, 0.3)' : '0 4px 10px rgba(59, 130, 246, 0.3)'}} 
            icon={scoringLogic.isController ? <CrownOutlined /> : <UserOutlined />} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontSize: 11, fontWeight: 800, color: scoringLogic.isController ? '#d97706' : '#2563eb', textTransform: 'uppercase', letterSpacing: 1 }}>Vai Trò Hội Đồng</Text>
            <Text strong style={{ fontSize: 16, color: scoringLogic.isController ? '#92400e' : '#1e40af', lineHeight: 1.2 }}>
              {scoringLogic.isController ? 'Trưởng Ban Giám Khảo' : 'Giám Khảo Thành Viên'}
            </Text>
          </div>
        </div>
      </Header>

      <Content style={{ padding: '40px', maxWidth: 1800, margin: '0 auto', width: '100%' }}>
        <Row gutter={40} align="stretch">
          {/* CỘT 1: Hàng đợi (Truyền thêm điểm myScoredSubmissions) */}
          <Col xs={24} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
             <JudgeSidebarQueue queue={scoringLogic.trackQueue} activeSlot={scoringLogic.activeSlot} isFinal={isFinal} myScores={scoringLogic.myScoredSubmissions} />
          </Col>

          {/* CỘT 2: Vùng chấm điểm */}
          <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
             <JudgeScoringWorkspace logic={scoringLogic} />
          </Col>

          {/* CỘT 3: Đồng hồ & Điều khiển */}
          <Col xs={24} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
             <JudgeTimerAndControls logic={scoringLogic} isFinal={isFinal} />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default LiveScoringPage;